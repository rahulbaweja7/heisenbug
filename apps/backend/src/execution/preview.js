import { createServer } from 'node:http';
import httpProxy from 'http-proxy';
import { hash, token } from './store.js';
export function previewServer(service, db, cfg) {
  const base = new URL(cfg.previewOrigin);
  if (base.origin === new URL(cfg.appOrigin).origin || base.origin === new URL(cfg.apiOrigin).origin) throw new Error('Preview must use a separate origin');
  const proxy = httpProxy.createProxyServer({ changeOrigin: true, ws: true, proxyTimeout: 15000, timeout: 15000, secure: true });
  const cookie = req => /(?:^|;\s*)hb_preview=([^;]+)/.exec(req.headers.cookie || '')?.[1];
  function sessionFor(req, credential) {
    if (!credential) throw new Error('Preview access expired');
    const grant = db.prepare('SELECT * FROM tickets WHERE token=? AND expires>?').get(hash(credential), Date.now());
    if (!grant) throw new Error('Preview access expired');
    const session = service.owned(grant.workspace_id, grant.user_id);
    if (req.headers.host !== `${session.id}.${base.host}`) throw new Error('Invalid preview host');
    if (!db.prepare('SELECT 1 FROM logins WHERE user_id=? AND expires>?').get(grant.user_id, Date.now())) throw new Error('Sign-in expired');
    return session;
  }
  function options(req, session) {
    // Never forward browser authentication or caller-supplied proxy headers.
    const keep = ['accept', 'accept-language', 'content-type', 'content-length', 'user-agent', 'upgrade', 'connection', 'sec-websocket-key', 'sec-websocket-version', 'sec-websocket-protocol'];
    req.headers = Object.fromEntries(Object.entries(req.headers).filter(([name]) => keep.includes(name)));
    if (!session.sandbox.trafficAccessToken) throw new Error('Private sandbox ingress is unavailable');
    req.headers['e2b-traffic-access-token'] = session.sandbox.trafficAccessToken;
    return { target: `https://${session.sandbox.getHost(session.previewConfig.previewPort)}` };
  }
  proxy.on('proxyRes', response => {
    delete response.headers['set-cookie']; delete response.headers['access-control-allow-origin'];
    response.headers['content-security-policy'] = `frame-ancestors ${cfg.appOrigin}; default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'`;
    response.headers['referrer-policy'] = 'no-referrer';
    response.headers['x-content-type-options'] = 'nosniff';
  });
  proxy.on('error', (_error, _req, res) => {
    if (typeof res.writeHead === 'function' && !res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Preview unavailable. Start or restart the web server.');
  });
  const server = createServer((req, res) => {
    try {
      const url = new URL(req.url, base);
      if (url.pathname === '/__heisenbug_connect') {
        const ticket = url.searchParams.get('ticket');
        const session = sessionFor(req, ticket);
        db.prepare('DELETE FROM tickets WHERE token=?').run(hash(ticket));
        const grant = token();
        db.prepare('INSERT INTO tickets VALUES (?,?,?,?)').run(hash(grant), session.id, session.userId, session.deadline);
        res.writeHead(302, { Location: '/', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'Set-Cookie': `hb_preview=${grant}; HttpOnly; Path=/; SameSite=Lax${base.protocol === 'https:' ? '; Secure' : ''}` }); res.end(); return;
      }
      const session = sessionFor(req, cookie(req));
      const expectedOrigin = `${base.protocol}//${session.id}.${base.host}`;
      if (!['GET', 'HEAD'].includes(req.method) && req.headers.origin !== expectedOrigin) throw new Error('Invalid preview request origin');
      session.lastActivity = Date.now();
      proxy.web(req, res, options(req, session));
    } catch {
      res.writeHead(403, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }); res.end('Preview expired. Reopen Preview from your workspace.');
    }
  });
  server.on('upgrade', (req, socket, head) => {
    try {
      const session = sessionFor(req, cookie(req));
      if (req.headers.origin !== `${base.protocol}//${session.id}.${base.host}`) throw new Error('Invalid origin');
      proxy.ws(req, socket, head, options(req, session));
    } catch { socket.destroy(); }
  });
  server.on('close', () => proxy.close());
  return server;
}
