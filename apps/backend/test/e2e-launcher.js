// Test-only HTTP harness. It is outside src/ and is never imported by production.
import { buildApp } from '../src/app.js';
import { config } from '../src/execution/config.js';
import { hash, token } from '../src/execution/store.js';
import { writeFile } from 'node:fs/promises';

class FakeProvider {
  constructor() { this.created = []; this.grades = []; }
  async create() { const s = { sandboxId: `fake-${this.created.length}`, snapshot: { files: {}, revision: '0' }, pty: { sendInput: async () => {}, resize: async () => {} }, commands: { run: async () => ({ pid: 1 }), kill: async () => {} }, getHost: () => '127.0.0.1' }; this.created.push(s); return s; }
  async seed(s, entries) { s.snapshot = { files: { ...entries }, revision: '1' }; return s.snapshot; }
  async files(s, payload) { if (payload) s.snapshot = { files: { ...payload.files }, revision: String(Number(s.snapshot.revision) + 1) }; return s.snapshot; }
  async terminal() { return { pid: 1, wait: async () => {} }; }
  async grade(s, files, tests) { this.grades.push({ sandboxId: s.sandboxId, files, tests }); return { passed: true, stdout: 'ok', stderr: '' }; }
  async kill() {}
}

const cfg = { ...config(), enabled: true, appOrigin: 'http://127.0.0.1:4173', apiOrigin: 'http://127.0.0.1:4001', dbPath: ':memory:', adminGithubIds: new Set(['admin']) };
const provider = new FakeProvider();
const app = await buildApp({ config: cfg, provider, logger: false });
const cookies = {};
for (const [id, login] of [['one', 'one'], ['two', 'two'], ['admin', 'admin']]) {
  const session = token();
  app.store.prepare('INSERT INTO users VALUES (?,?)').run(id, login);
  app.store.prepare('INSERT INTO logins VALUES (?,?,?)').run(hash(session), id, Date.now() + 86_400_000);
  cookies[id] = session;
}
await writeFile(process.env.HEISENBUG_COOKIE_FILE || '/tmp/heisenbug-test-cookies.json', JSON.stringify(cookies));
await app.listen({ host: '127.0.0.1', port: 4001 });
console.log('HEISENBUG_TEST_READY');
const stop = async () => { await app.close(); process.exit(0); };
process.on('SIGTERM', stop); process.on('SIGINT', stop);
