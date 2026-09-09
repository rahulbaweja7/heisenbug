import { createHash } from 'node:crypto';
import { token, hash } from './store.js';
import { fail } from './config.js';
export function registerAuth(app, db, cfg, onLogout = async () => {}) {
  const secure = cfg.apiOrigin.startsWith('https:');
  const cookie = { path: '/', httpOnly: true, secure, sameSite: 'lax' };
  function user(req) {
    const key = req.cookies.hb_session;
    return key && db.prepare('SELECT users.* FROM users JOIN logins ON users.id=logins.user_id WHERE logins.token=? AND expires>?').get(hash(key), Date.now());
  }
  function requireUser(req) {
    const found = user(req);
    if (!found) throw fail(401, 'Sign in with GitHub to execute code');
    return found;
  }
  function origin(req) {
    if (req.headers.origin !== cfg.appOrigin) throw fail(403, 'Invalid request origin');
  }
  app.get('/api/auth/me', async req => ({ user: user(req) || null, executionEnabled: cfg.enabled, isAdmin: !!(user(req) && cfg.adminGithubIds?.has(String(user(req).id))) }));
  app.get('/api/auth/github', async (req, reply) => {
    if (!cfg.clientId || !cfg.clientSecret) throw fail(503, 'GitHub sign-in is not configured');
    const state = token(), verifier = token();
    const returnPath = typeof req.query.returnTo === 'string' && /^\/challenge\/[a-zA-Z0-9-]+$/.test(req.query.returnTo) ? req.query.returnTo : '/challenges';
    db.prepare('DELETE FROM oauth WHERE expires<?').run(Date.now());
    db.prepare('INSERT INTO oauth VALUES (?,?,?,?)').run(hash(state), verifier, returnPath, Date.now() + 600000);
    reply.setCookie('hb_oauth', state, { ...cookie, maxAge: 600 });
    const url = new URL('https://github.com/login/oauth/authorize');
    url.search = new URLSearchParams({ client_id: cfg.clientId, redirect_uri: `${cfg.apiOrigin}/api/auth/callback`, state, code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' }).toString();
    return reply.redirect(url.href);
  });
  app.get('/api/auth/callback', async (req, reply) => {
    const { state, code } = req.query;
    if (typeof state !== 'string' || typeof code !== 'string' || state !== req.cookies.hb_oauth) throw fail(400, 'Invalid sign-in callback');
    const flow = db.prepare('DELETE FROM oauth WHERE token=? AND expires>? RETURNING *').get(hash(state), Date.now());
    if (!flow) throw fail(400, 'Sign-in expired; try again');
    const res = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000), body: JSON.stringify({ client_id: cfg.clientId, client_secret: cfg.clientSecret, code, code_verifier: flow.verifier, redirect_uri: `${cfg.apiOrigin}/api/auth/callback` }) });
    const data = await res.json();
    if (!res.ok || !data.access_token) throw fail(502, 'GitHub sign-in failed');
    const profile = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${data.access_token}`, 'User-Agent': 'Heisenbug' }, signal: AbortSignal.timeout(10000) });
    const identity = await profile.json();
    if (!profile.ok || !identity.id || !identity.login) throw fail(502, 'Could not load GitHub identity');
    const id = String(identity.id), session = token();
    db.prepare('INSERT INTO users VALUES (?,?) ON CONFLICT(id) DO UPDATE SET login=excluded.login').run(id, identity.login);
    db.prepare('INSERT INTO logins VALUES (?,?,?)').run(hash(session), id, Date.now() + 7 * 86400000);
    reply.clearCookie('hb_oauth', { path: '/' }).setCookie('hb_session', session, { ...cookie, maxAge: 7 * 86400 });
    return reply.redirect(cfg.appOrigin + flow.return_path);
  });
  app.post('/api/auth/logout', async (req, reply) => {
    origin(req);
    const identity = user(req);
    if (identity) {
      await onLogout(identity.id);
      db.prepare('DELETE FROM tickets WHERE user_id=?').run(identity.id);
    }
    if (req.cookies.hb_session) db.prepare('DELETE FROM logins WHERE token=?').run(hash(req.cookies.hb_session));
    reply.clearCookie('hb_session', { path: '/' });
    return { ok: true };
  });
  return { user, requireUser, origin };
}
