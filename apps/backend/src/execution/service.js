import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { getChallenge, challengeDir } from '../challenges.js';
import { fail, validateFiles } from './config.js';
export class ExecutionService {
  constructor(db, cfg, provider, logger) {
    Object.assign(this, { db, cfg, provider, logger });
    this.sessions = new Map(); this.pending = new Set(); this.orphans = new Map(); this.active = 0;
  }
  async reconcile() {
    for (const row of this.db.prepare('SELECT * FROM workspaces WHERE ended IS NULL').all()) {
      if (row.sandbox_id) {
        try { await this.provider.kill(row.sandbox_id); }
        catch (error) {
          if (Date.now() < row.deadline) { this.orphans.set(row.id, row); this.active++; this.logger.warn({ err: error }, 'Retrying abandoned sandbox cleanup'); continue; }
        }
      }
      this.db.prepare('UPDATE workspaces SET ended=? WHERE id=?').run(Math.min(Date.now(), row.deadline), row.id);
    }
  }
  usage(userId) {
    const now = Date.now(), day = Math.floor(now / 86400000) * 86400000;
    return this.db.prepare('SELECT COALESCE(SUM(MAX(0, MIN(COALESCE(ended, ?), deadline) - MAX(started, ?))),0) AS used FROM workspaces WHERE user_id=? AND COALESCE(ended,deadline)>?').get(now, day, userId, day).used;
  }
  reserve(userId, kind) {
    if (!this.cfg.enabled) throw fail(503, 'Code execution is disabled');
    if (this.active >= this.cfg.maxSessions) throw fail(429, 'Execution capacity is full; try again shortly');
    if (this.usage(userId) >= this.cfg.dailyMs) throw fail(429, 'Daily execution allowance reached');
    const key = `${kind}:${userId}`;
    if (this.pending.has(key) || [...this.sessions.values()].some(s => s.userId === userId && s.kind === kind)) throw fail(409, `An active ${kind} session already exists`);
    this.pending.add(key); this.active++;
    return () => { this.pending.delete(key); this.active--; };
  }
  async create(userId, challengeId, files, kind = 'workspace') {
    validateFiles(files);
    const challenge = await getChallenge(challengeId).catch(() => { throw fail(404, 'Challenge not found'); });
    const release = this.reserve(userId, kind);
    const now = Date.now(), id = randomUUID();
    const deadline = now + Math.min(kind === 'grading' ? 30000 : this.cfg.maxMs, this.cfg.dailyMs - this.usage(userId));
    this.db.prepare('INSERT INTO workspaces VALUES (?,?,?,?,?,?,?)').run(id, userId, null, kind, now, null, deadline);
    let sandbox;
    try {
      sandbox = await this.provider.create(deadline - now);
      this.db.prepare('UPDATE workspaces SET sandbox_id=? WHERE id=?').run(sandbox.sandboxId, id);
      const snapshot = await this.provider.seed(sandbox, files);
      const session = { id, userId, challengeId, kind, sandbox, snapshot, started: now, deadline, lastActivity: now, release, sockets: new Set(), output: Buffer.alloc(0), queue: Promise.resolve(), preview: null };
      this.sessions.set(id, session);
      if (kind === 'workspace') {
        session.pty = await this.provider.terminal(sandbox, data => {
          const buffer = Buffer.from(data);
          session.output = Buffer.concat([session.output, buffer]).subarray(-50000);
          for (const ws of session.sockets) {
            if (ws.bufferedAmount > 1000000) ws.close(1013, 'Terminal output exceeded buffer');
            else if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'output', data: buffer.toString('base64') }));
          }
        });
        session.pty.wait().then(() => { for (const ws of session.sockets) ws.close(1000, 'Shell exited; restart workspace'); }).catch(() => { for (const ws of session.sockets) ws.close(1011, 'Terminal disconnected'); });
      }
      session.previewConfig = challenge.meta.workspace;
      this.logger.info({ workspaceId: id, kind, startupMs: Date.now() - now }, 'Sandbox started');
      return session;
    } catch (error) {
      this.sessions.delete(id);
      let killed = true;
      if (sandbox) await this.provider.kill(sandbox.sandboxId).catch(err => { killed = false; this.logger.error({ err }, 'Sandbox cleanup failed'); });
      if (killed) { this.db.prepare('UPDATE workspaces SET ended=? WHERE id=?').run(Date.now(), id); release(); }
      else this.orphans.set(id, { id, sandbox_id: sandbox.sandboxId, deadline, release });
      throw error;
    }
  }
  owned(id, userId) {
    const session = this.sessions.get(id);
    if (!session || session.userId !== userId || session.kind !== 'workspace') throw fail(404, 'Workspace not found or expired');
    if (Date.now() >= session.deadline || Date.now() - session.lastActivity >= this.cfg.idleMs) throw fail(410, 'Workspace expired');
    return session;
  }
  serial(session, operation) {
    const result = session.queue.then(operation);
    session.queue = result.catch(() => {});
    return result;
  }
  async sync(session, payload) {
    return this.serial(session, async () => {
      if (payload) validateFiles(payload.files);
      const snapshot = await this.provider.files(session.sandbox, payload);
      if (payload) session.lastActivity = Date.now();
      session.snapshot = snapshot;
      return snapshot;
    });
  }
  describe(session) {
    return { id: session.id, challengeId: session.challengeId, deadline: session.deadline, previewAvailable: !!session.previewConfig?.previewPort, ...session.snapshot };
  }
  async stop(session) {
    if (session.stopping) return session.stopping;
    session.stopping = (async () => {
      for (const ws of session.sockets) ws.close(1000, 'Workspace stopped');
      try { await this.provider.kill(session.sandbox.sandboxId); }
      catch (error) { if (Date.now() < session.deadline) throw error; }
      this.sessions.delete(session.id);
      this.db.prepare('UPDATE workspaces SET ended=? WHERE id=?').run(Math.min(Date.now(), session.deadline), session.id);
      session.release();
      this.logger.info({ workspaceId: session.id, durationMs: Date.now() - session.started }, 'Sandbox stopped');
    })().catch(error => { session.stopping = null; throw error; });
    return session.stopping;
  }
  async sweep() {
    for (const row of this.orphans.values()) {
      try { await this.provider.kill(row.sandbox_id); }
      catch { if (Date.now() < row.deadline) continue; }
      this.db.prepare('UPDATE workspaces SET ended=? WHERE id=?').run(Math.min(Date.now(), row.deadline), row.id);
      this.orphans.delete(row.id);
      if (row.release) row.release(); else this.active--;
    }
    for (const session of this.sessions.values()) {
      if (Date.now() >= session.deadline || Date.now() - session.lastActivity >= this.cfg.idleMs || this.usage(session.userId) >= this.cfg.dailyMs) await this.stop(session).catch(err => this.logger.error({ err }, 'Sandbox cleanup will retry'));
    }
    this.db.prepare('DELETE FROM tickets WHERE expires<?').run(Date.now());
    this.db.prepare('DELETE FROM logins WHERE expires<?').run(Date.now());
  }
  async grade(userId, challengeId, files) {
    const session = await this.create(userId, challengeId, files, 'grading');
    try {
      const tests = [];
      async function readTests(dir, prefix = '') {
        for (const entry of await readdir(dir, { withFileTypes: true })) {
          if (entry.name === '__pycache__') continue;
          if (entry.isDirectory()) await readTests(path.join(dir, entry.name), prefix + entry.name + '/');
          else if (entry.isFile()) tests.push({ name: prefix + entry.name, content: await readFile(path.join(dir, entry.name), 'utf8') });
        }
      }
      await readTests(path.join(challengeDir(challengeId), 'tests'));
      return await this.provider.grade(session.sandbox, files, tests);
    } finally { await this.stop(session); }
  }
}
