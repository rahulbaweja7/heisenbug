import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { config } from '../src/execution/config.js';
import { E2BProvider } from '../src/execution/provider.js';
import { hash, token } from '../src/execution/store.js';

const cfg = config({ ...process.env, DATABASE_PATH: ':memory:', EXECUTION_ENABLED: 'true' });
if (!cfg.apiKey || !cfg.template) throw new Error('Set E2B_API_KEY and E2B_TEMPLATE before running the live smoke test');

const liveProvider = new E2BProvider(cfg);
const active = new Map();
const created = [];
const provider = {
  async create(timeoutMs) {
    const sandbox = await liveProvider.create(timeoutMs);
    active.set(sandbox.sandboxId, sandbox);
    created.push(sandbox);
    return sandbox;
  },
  async kill(sandboxId) {
    await liveProvider.kill(sandboxId);
    active.delete(sandboxId);
  },
  files: (...args) => liveProvider.files(...args),
  seed: (...args) => liveProvider.seed(...args),
  terminal: (...args) => liveProvider.terminal(...args),
  grade: (...args) => liveProvider.grade(...args),
};

const app = await buildApp({ config: cfg, provider, logger: false });
const userId = 'e2b-smoke-user';
const sessionToken = token();
app.store.prepare('INSERT INTO users VALUES (?,?)').run(userId, userId);
app.store.prepare('INSERT INTO logins VALUES (?,?,?)').run(hash(sessionToken), userId, Date.now() + 86400000);
const request = (method, url, payload) => app.inject({
  method,
  url,
  payload,
  headers: { origin: cfg.appOrigin, cookie: `hb_session=${sessionToken}` },
});
const quote = value => `'${value.replaceAll("'", "'\\''")}'`;
const create = timeoutMs => provider.create(timeoutMs);
const solutionFiles = {
  'src/inventory.py': 'def count_low_stock(items, threshold):\n    return sum(item["quantity"] <= threshold for item in items)\n',
};

try {
  const createdResponse = await request('POST', '/api/workspaces', {
    challengeId: '001-off-by-one-inventory',
    files: solutionFiles,
    analyticsSessionId: 'e2b-smoke',
  });
  assert.equal(createdResponse.statusCode, 200, createdResponse.body);
  const workspaceSession = createdResponse.json();
  const workspaceRow = app.store.prepare('SELECT sandbox_id FROM workspaces WHERE id=?').get(workspaceSession.id);
  const workspace = active.get(workspaceRow.sandbox_id);
  assert.ok(workspace, 'the API-created workspace must be tracked for cleanup');

  let filesResponse = await request('GET', `/api/workspaces/${workspaceSession.id}/files`);
  assert.equal(filesResponse.statusCode, 200, filesResponse.body);
  let snapshot = filesResponse.json();
  assert.equal(snapshot.files['src/inventory.py'], solutionFiles['src/inventory.py']);
  assert.equal(Object.keys(snapshot.files).some(name => name === 'tests' || name.startsWith('tests/')), false, 'interactive workspaces must not contain reserved tests');

  snapshot = await provider.files(workspace, { files: { ...snapshot.files, 'scratch.py': 'print(42)\n' }, revision: snapshot.revision });
  assert.equal(snapshot.conflict, undefined);
  let output = '';
  const pty = await provider.terminal(workspace, data => { output += Buffer.from(data).toString(); });
  await workspace.pty.sendInput(pty.pid, Buffer.from('python -c "print(6 * 7)"\r'));
  for (let n = 0; n < 30 && !output.includes('42'); n++) await new Promise(resolve => setTimeout(resolve, 100));
  assert.match(output, /42/);
  const checks = await workspace.commands.run('/usr/bin/python3 -I -c \'import os; assert os.geteuid() != 0; assert not os.access("/opt/venv/bin/python", os.W_OK)\'', { user: 'user' });
  assert.equal(checks.exitCode, 0);
  let networkBlocked = false;
  try {
    const network = await workspace.commands.run(`/usr/bin/python3 -I -c ${quote("import socket\nsocket.create_connection(('1.1.1.1', 80), 1)\n")}`, { user: 'user', timeoutMs: 3000 });
    networkBlocked = network.exitCode !== 0;
  } catch (error) { networkBlocked = /timeout|refused|unreachable|network/i.test(String(error)); }
  assert.equal(networkBlocked, true, 'the interactive sandbox must not reach the public internet');

  const gradeResponse = await request('POST', '/api/challenges/001-off-by-one-inventory/submit', {
    files: solutionFiles,
    requestId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    analyticsSessionId: 'e2b-smoke',
  });
  assert.equal(gradeResponse.statusCode, 200, gradeResponse.body);
  const gradeResult = gradeResponse.json();
  assert.equal(gradeResult.passed, true, gradeResult.stderr + gradeResult.stdout);
  assert.equal(created.length, 2, 'API grading must allocate one separate grading sandbox');
  assert.notEqual(created[0].sandboxId, created[1].sandboxId, 'interactive and grading sandboxes must be distinct');

  const failing = await create(30000);
  const failed = await provider.grade(failing, snapshot.files, [{ name: 'test_failure.py', content: 'def test_failure(): assert False\n' }]);
  assert.equal(failed.passed, false);

  const noisy = await create(30000);
  const overflow = await provider.grade(noisy, { 'src/noisy.py': 'print("x" * 60000)\n' }, [{ name: 'test_noisy.py', content: 'import src.noisy\ndef test_noisy(): pass\n' }]);
  assert.equal(overflow.passed, false);
  assert.match(overflow.stderr, /output exceeded/i);

  const timeout = await create(30000);
  const timed = await provider.grade(timeout, { 'src/hang.py': 'while True: pass\n' }, [{ name: 'test_hang.py', content: 'import src.hang\n' }]);
  assert.equal(timed.passed, false);
  assert.match(timed.stderr, /10-second/i);
  console.log(`Live E2B smoke passed for ${created.length} sandboxes; API workspace/grading isolation, hidden-test exclusion, network denial, limits, and cleanup paths exercised.`);
} finally {
  try {
    await app.close();
  } catch (error) {
    console.error(`Application shutdown failed: ${error}`);
    process.exitCode = 1;
  }
  const remaining = [...active.keys()];
  const cleanup = await Promise.allSettled(remaining.map(sandboxId => provider.kill(sandboxId)));
  const failures = cleanup.flatMap((result, index) => result.status === 'rejected' ? [{ sandboxId: remaining[index], reason: result.reason }] : []);
  if (failures.length) {
    for (const failure of failures) console.error(`E2B cleanup failed for ${failure.sandboxId}: ${failure.reason}`);
    process.exitCode = 1;
  }
}
