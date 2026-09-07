import test from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { config, validateFiles } from '../src/execution/config.js';
import { hash } from '../src/execution/store.js';
import { E2BProvider } from '../src/execution/provider.js';
import { previewServer } from '../src/execution/preview.js';
import { EventEmitter } from 'node:events';
import { request as httpRequest } from 'node:http';
const localGet = (url, headers) => new Promise((resolve, reject) => {
  const request = httpRequest(url, { headers }, response => {
    let body = ''; response.on('data', chunk => { body += chunk; });
    response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body }));
  });
  request.on('error', reject); request.end();
});
const challengeId = '048-django-imdb-movie-search';
const files = { 'src/example.py': 'print("hello")' };
class FakeProvider {
  constructor() { this.created = []; this.killed = []; this.lastTests = []; }
  async create() {
    const sandbox = { sandboxId: `sandbox-${this.created.length}`, trafficAccessToken: 'secret', pty: { sendInput: async (_pid, input) => { sandbox.input = input.toString(); }, resize: async () => {} }, commands: { run: async () => ({ pid: 2 }), kill: async () => {} }, getHost: () => 'unreachable.invalid' };
    this.created.push(sandbox); return sandbox;
  }
  async seed(sandbox, entries) { sandbox.snapshot = { files: { ...entries }, revision: '1' }; return sandbox.snapshot; }
  async files(sandbox, payload) {
    if (payload) {
      if (payload.revision !== sandbox.snapshot.revision) return { ...sandbox.snapshot, conflict: true };
      sandbox.snapshot = { files: { ...payload.files }, revision: String(Number(payload.revision) + 1) };
    }
    return sandbox.snapshot;
  }
  async terminal(_sandbox, onData) { this.onData = onData; return { pid: 1, wait: () => new Promise(() => {}) }; }
  async kill(id) { this.killed.push(id); }
  async grade(_sandbox, _files, tests) { this.lastTests = tests; return { passed: true, stdout: '1 passed', stderr: '' }; }
}
async function setup(t, overrides = {}, provider = new FakeProvider()) {
  const cfg = { ...config(), enabled: true, dbPath: ':memory:', ...overrides };
  const app = await buildApp({ config: cfg, provider, logger: false });
  for (const id of ['one', 'two']) {
    app.store.prepare('INSERT INTO users VALUES (?,?)').run(id, id);
    app.store.prepare('INSERT INTO logins VALUES (?,?,?)').run(hash(id), id, Date.now() + 86400000);
  }
  t.after(() => app.close());
  const request = (method, url, payload, user = 'one', origin = cfg.appOrigin) => app.inject({ method, url, payload, headers: { origin, cookie: `hb_session=${user}` } });
  return { app, provider, cfg, request };
}
test('reject traversal, reserved paths, binary content and oversized workspaces', () => {
  for (const name of ['../secret', '/etc/passwd', 'C:/a', 'src/../a', 'src//a', 'tests/test_a.py', 'a\\b', '.git/config']) assert.throws(() => validateFiles({ [name]: 'x' }));
  assert.throws(() => validateFiles([]));
  assert.throws(() => validateFiles({ a: 'x'.repeat(100001) }));
  assert.throws(() => validateFiles({ a: '\0' }));
  assert.throws(() => validateFiles({ a: 'text', 'a/b': 'text' }));
  assert.throws(() => validateFiles({ '.env': 'text' }));
  assert.deepEqual(validateFiles(files), files);
});
test('OAuth PKCE flow binds state to the browser and rejects replay', async t => {
  const { request, app } = await setup(t, { clientId: 'client', clientSecret: 'secret' });
  const redirect = await request('GET', '/api/auth/github?returnTo=/challenge/048-django-imdb-movie-search');
  assert.equal(redirect.statusCode, 302);
  const url = new URL(redirect.headers.location);
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('scope'), null);
  const state = url.searchParams.get('state');
  assert.equal((await request('GET', `/api/auth/callback?state=${state}&code=example`)).statusCode, 400);
  let exchange;
  t.mock.method(globalThis, 'fetch', async (destination, options) => {
    if (destination.includes('access_token')) { exchange = JSON.parse(options.body); return { ok: true, json: async () => ({ access_token: 'temporary' }) }; }
    return { ok: true, json: async () => ({ id: 42, login: 'candidate' }) };
  });
  const login = await app.inject({ url: `/api/auth/callback?state=${state}&code=example`, headers: { cookie: `hb_oauth=${state}` } });
  assert.equal(login.statusCode, 302);
  assert.equal(typeof exchange.code_verifier, 'string');
  assert.ok(login.cookies.some(cookie => cookie.name === 'hb_session' && cookie.httpOnly));
  assert.equal(app.store.prepare('SELECT COUNT(*) AS n FROM oauth').get().n, 0);
  assert.equal((await app.inject({ url: `/api/auth/callback?state=${state}&code=example`, headers: { cookie: `hb_oauth=${state}` } })).statusCode, 400);
});
test('restart reconciliation reserves capacity until abandoned cleanup succeeds', async t => {
  const { app, provider, request } = await setup(t, { maxSessions: 1 });
  const now = Date.now();
  app.store.prepare('INSERT INTO workspaces VALUES (?,?,?,?,?,?,?)').run('orphan', 'one', 'old', 'workspace', now, null, now + 60000);
  provider.kill = async () => { throw new Error('offline'); };
  await app.execution.reconcile();
  assert.equal(app.execution.active, 1);
  assert.equal((await request('POST', '/api/workspaces', { challengeId, files }, 'two')).statusCode, 429);
  provider.kill = async () => {};
  await app.execution.sweep();
  assert.equal(app.execution.active, 0);
  assert.ok(app.store.prepare('SELECT ended FROM workspaces WHERE id=?').get('orphan').ended);
});
test('preview bootstrap is one-time and proxy strips browser credentials', async t => {
  const { request, app, cfg } = await setup(t);
  const session = (await request('POST', '/api/workspaces', { challengeId, files })).json();
  const url = new URL((await request('POST', `/api/workspaces/${session.id}/preview`, {})).json().url);
  let forwarded;
  const proxy = new EventEmitter(); proxy.close = () => {};
  proxy.web = (req, res, options) => { forwarded = { headers: req.headers, options }; req.resume(); res.end('preview'); };
  const server = previewServer(app.execution, app.store, cfg, () => proxy);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const headers = { host: url.host };
  const connect = await localGet(origin + url.pathname + url.search, headers);
  assert.equal(connect.status, 302);
  assert.equal((await localGet(origin + url.pathname + url.search, headers)).status, 403);
  const cookie = connect.headers['set-cookie'][0].split(';')[0];
  const response = await localGet(origin + '/', { ...headers, cookie: `${cookie}; hb_session=private`, authorization: 'Bearer private', 'x-forwarded-host': 'evil.invalid' });
  assert.equal(response.body, 'preview');
  assert.equal(forwarded.headers.cookie, undefined);
  assert.equal(forwarded.headers.authorization, undefined);
  assert.equal(forwarded.headers['x-forwarded-host'], undefined);
  assert.equal(forwarded.headers['e2b-traffic-access-token'], 'secret');
  assert.equal(forwarded.options.target, 'https://unreachable.invalid');
});
test('authentication, origin checks and feature flag precede sandbox allocation', async t => {
  const { request, provider } = await setup(t, { enabled: false });
  assert.equal((await request('POST', '/api/workspaces', { challengeId, files }, 'missing')).statusCode, 401);
  assert.equal((await request('POST', '/api/workspaces', { challengeId, files }, 'one', 'https://evil.invalid')).statusCode, 403);
  assert.equal((await request('POST', '/api/workspaces', { challengeId, files })).statusCode, 503);
  assert.equal(provider.created.length, 0);
});
test('workspace ownership, revision conflicts, terminal changes and cleanup', async t => {
  const { request, provider } = await setup(t);
  const created = await request('POST', '/api/workspaces', { challengeId, files });
  assert.equal(created.statusCode, 200, created.body);
  const session = created.json();
  assert.equal((await request('GET', `/api/workspaces/${session.id}`, undefined, 'two')).statusCode, 404);
  const conflict = await request('PUT', `/api/workspaces/${session.id}/files`, { files, revision: 'stale' });
  assert.equal(conflict.statusCode, 409);
  const saved = await request('PUT', `/api/workspaces/${session.id}/files`, { files: { 'scratch.py': 'print(42)' }, revision: session.revision });
  assert.equal(saved.statusCode, 200);
  provider.created[0].snapshot = { files: { 'terminal.py': '42' }, revision: '3' };
  assert.deepEqual((await request('GET', `/api/workspaces/${session.id}/files`)).json().files, { 'terminal.py': '42' });
  assert.equal((await request('DELETE', `/api/workspaces/${session.id}`)).statusCode, 200);
  assert.equal(provider.killed.length, 1);
  assert.equal((await request('GET', `/api/workspaces/${session.id}`)).statusCode, 404);
});
test('one workspace per user, capacity and daily quota', async t => {
  const { request, app } = await setup(t, { maxSessions: 1 });
  const session = (await request('POST', '/api/workspaces', { challengeId, files })).json();
  assert.equal((await request('POST', '/api/workspaces', { challengeId, files }, 'two')).statusCode, 429);
  await request('DELETE', `/api/workspaces/${session.id}`);
  const now = Date.now();
  app.store.prepare('INSERT INTO workspaces VALUES (?,?,?,?,?,?,?)').run('spent', 'one', 'old', 'workspace', now - 3 * 3600000, now, now);
  // Daily accounting intentionally clips at UTC midnight.
  app.execution.cfg.dailyMs = 1;
  assert.equal((await request('POST', '/api/workspaces', { challengeId, files })).statusCode, 429);
});
test('idle expiry and failed sandbox startup release capacity', async t => {
  const { request, app, provider } = await setup(t);
  const session = (await request('POST', '/api/workspaces', { challengeId, files })).json();
  app.execution.sessions.get(session.id).lastActivity = 0;
  assert.equal((await request('GET', `/api/workspaces/${session.id}`)).statusCode, 410);
  await app.execution.sweep(); assert.equal(app.execution.active, 0);
  provider.seed = async () => { throw new Error('seed failed'); };
  assert.equal((await request('POST', '/api/workspaces', { challengeId, files })).statusCode, 502);
  assert.equal(app.execution.active, 0);
});
test('grading uses a separate sandbox and server-held tests', async t => {
  const { request, provider } = await setup(t);
  await request('POST', '/api/workspaces', { challengeId, files });
  assert.equal((await request('POST', `/api/challenges/${challengeId}/submit`, { files })).json().passed, true);
  assert.equal(provider.created.length, 2);
  assert.ok(provider.lastTests.some(t => t.name === 'test_cinematch.py'));
  assert.deepEqual(provider.created[0].snapshot.files, files);
  assert.equal(provider.killed.length, 1);
});
test('provider grading distinguishes output overflow, timeout and infrastructure failure', async () => {
  const provider = new E2BProvider({}); provider.seed = async () => {};
  let killed = false;
  const sandbox = { files: { makeDir: async () => {}, write: async () => {} }, kill: async () => { killed = true; }, commands: { run: async (_command, options) => { options.onStdout('x'.repeat(51000)); throw new Error('terminated'); } } };
  assert.equal((await provider.grade(sandbox, {}, [])).passed, false); assert.equal(killed, true);
  sandbox.commands.run = async () => { throw new Error('timeout'); };
  assert.match((await provider.grade(sandbox, {}, [])).stderr, /10-second/);
  sandbox.commands.run = async () => { throw new Error('provider offline'); };
  await assert.rejects(provider.grade(sandbox, {}, []), /provider offline/);
});
test('preview tickets are scoped to their workspace host and revoked on logout', async t => {
  const { request, app, cfg } = await setup(t);
  const session = (await request('POST', '/api/workspaces', { challengeId, files })).json();
  const opened = await request('POST', `/api/workspaces/${session.id}/preview`, {});
  assert.equal(opened.statusCode, 200, opened.body);
  const url = new URL(opened.json().url);
  assert.equal(url.hostname, `${session.id}.localhost`);
  const server = previewServer(app.execution, app.store, cfg);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const port = server.address().port;
  const res = await fetch(`http://127.0.0.1:${port}${url.pathname}${url.search}`, { redirect: 'manual', headers: { host: 'wrong.localhost:4002' } });
  assert.equal(res.status, 403);
  await request('POST', '/api/auth/logout');
  assert.equal(app.store.prepare('SELECT COUNT(*) AS n FROM tickets').get().n, 0);
});
test('WebSocket ownership and real input/output bridge', async t => {
  const { request, app, provider, cfg } = await setup(t);
  const session = (await request('POST', '/api/workspaces', { challengeId, files })).json();
  await assert.rejects(app.injectWS(`/api/workspaces/${session.id}/terminal`, { headers: { origin: cfg.appOrigin, cookie: 'hb_session=two' } }));
  const socket = await app.injectWS(`/api/workspaces/${session.id}/terminal`, { headers: { origin: cfg.appOrigin, cookie: 'hb_session=one' } });
  socket.send(JSON.stringify({ type: 'input', data: 'print(42)\r' }));
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(provider.created[0].input, 'print(42)\r');
  const output = new Promise(resolve => socket.once('message', raw => resolve(JSON.parse(raw.toString()))));
  provider.onData(Buffer.from('42\r\n'));
  assert.equal(Buffer.from((await output).data, 'base64').toString(), '42\r\n');
  socket.close();
});
