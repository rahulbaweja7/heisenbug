import { fail } from './config.js';
import { token, hash } from './store.js';
import { runSubmission } from '../runner.js';
export function registerExecution(app, service, auth, cfg, db) {
  const access = req => { auth.origin(req); return auth.requireUser(req); };
  const owned = req => service.owned(req.params.id, auth.requireUser(req).id);
  app.get('/api/workspaces', async req => {
    const user = auth.requireUser(req);
    return { workspaces: [...service.sessions.values()].filter(s => s.userId === user.id && s.kind === 'workspace').map(s => service.describe(s)) };
  });
  app.post('/api/workspaces', async req => {
    const user = access(req);
    return service.describe(await service.create(user.id, req.body?.challengeId, req.body?.files));
  });
  app.get('/api/workspaces/:id', async req => service.describe(owned(req)));
  app.delete('/api/workspaces/:id', async req => { access(req); await service.stop(owned(req)); return { ok: true }; });
  app.get('/api/workspaces/:id/files', async req => service.sync(owned(req)));
  app.put('/api/workspaces/:id/files', async (req, reply) => {
    access(req);
    const snapshot = await service.sync(owned(req), req.body);
    if (snapshot.conflict) reply.code(409);
    return snapshot;
  });
  // With no E2B key / EXECUTION_ENABLED=false, grade locally and unauthenticated
  // so the existing pytest-based challenge library works with zero cloud setup.
  // When execution is enabled, grading requires a signed-in user and runs in an
  // isolated E2B sandbox instead (see ExecutionService.grade).
  app.post('/api/challenges/:id/submit', async (req, reply) => {
    if (!cfg.enabled) {
      const { files } = req.body ?? {};
      if (!files || typeof files !== 'object') { reply.code(400); return { error: 'expected { files: { [path]: contents } }' }; }
      return runSubmission(req.params.id, files);
    }
    return service.grade(access(req).id, req.params.id, req.body?.files);
  });
  app.post('/api/workspaces/:id/preview', async req => {
    access(req); const session = owned(req);
    const preview = session.previewConfig;
    if (!preview?.previewPort) throw fail(400, 'This challenge has no web preview');
    await service.serial(session, async () => {
      if (req.body?.restart && session.preview) { await session.sandbox.commands.kill(session.preview.pid); session.preview = null; }
      if (!session.preview) {
        let bytes = 0, exceeded = false;
        const output = chunk => {
          bytes += Buffer.byteLength(chunk);
          if (bytes > 100000 && !exceeded) { exceeded = true; service.stop(session).catch(error => app.log.error({ err: error }, 'Preview output limit cleanup failed')); }
        };
        session.preview = await session.sandbox.commands.run(preview.startCommand, { user: 'user', cwd: '/workspace', background: true, timeoutMs: 0, onStdout: output, onStderr: output });
        const process = session.preview;
        process.wait?.().catch(() => {}).finally(() => { if (session.preview === process) session.preview = null; });
      }
      await session.sandbox.commands.run(`/usr/bin/python3 -I -c 'import socket,time\nfor attempt in range(30):\n try:\n  s=socket.create_connection(("127.0.0.1",${preview.previewPort}),0.2);s.close();break\n except OSError:\n  time.sleep(0.1)\nelse:\n raise RuntimeError("Preview server did not start")'`, { user: 'user', cwd: '/', timeoutMs: 6000 });
    });
    session.lastActivity = Date.now();
    const ticket = token();
    db.prepare('INSERT INTO tickets VALUES (?,?,?,?)').run(hash(ticket), session.id, session.userId, Date.now() + 60000);
    const url = new URL(cfg.previewOrigin); url.hostname = `${session.id}.${url.hostname}`;
    url.pathname = '/__heisenbug_connect'; url.searchParams.set('ticket', ticket);
    return { url: url.href };
  });
  app.get('/api/workspaces/:id/terminal', { websocket: true, preValidation: async req => { access(req); owned(req); } }, (socket, req) => {
    const session = owned(req);
    if (session.sockets.size >= 1) { socket.close(1008, 'Terminal is already open in another tab'); return; }
    session.sockets.add(socket);
    socket.send(JSON.stringify({ type: 'output', data: session.output.toString('base64') }));
    socket.send(JSON.stringify({ type: 'ready' }));
    let pending = 0;
    socket.on('message', raw => {
      try {
        const immediate = JSON.parse(raw.toString());
        if (immediate.type === 'input' && immediate.data === '\x03') {
          owned(req);
          session.lastActivity = Date.now();
          session.sandbox.pty.sendInput(session.pty.pid, Buffer.from('\x03')).catch(() => socket.close(1011, 'Interrupt failed'));
          return;
        }
      } catch { socket.close(1008, 'Invalid terminal message'); return; }
      if (++pending > 100) { socket.close(1008, 'Too much pending input'); return; }
      service.serial(session, async () => {
        owned(req);
        const message = JSON.parse(raw.toString());
        if (message.type === 'input' && typeof message.data === 'string' && message.data.length <= 16384) {
          await session.sandbox.pty.sendInput(session.pty.pid, Buffer.from(message.data));
          session.lastActivity = Date.now();
        } else if (message.type === 'resize' && Number.isInteger(message.cols) && Number.isInteger(message.rows)) {
          await session.sandbox.pty.resize(session.pty.pid, { cols: Math.max(2, Math.min(300, message.cols)), rows: Math.max(2, Math.min(100, message.rows)) });
        } else throw fail(400, 'Invalid terminal message');
      }).catch(() => socket.close(1011, 'Terminal connection failed')).finally(() => pending--);
    });
    socket.on('close', () => session.sockets.delete(socket));
    socket.on('error', () => session.sockets.delete(socket));
  });
}
