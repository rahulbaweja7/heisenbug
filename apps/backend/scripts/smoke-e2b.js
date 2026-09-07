import assert from 'node:assert/strict';
import { config } from '../src/execution/config.js';
import { E2BProvider } from '../src/execution/provider.js';
const cfg = config();
if (!cfg.apiKey || !cfg.template) throw new Error('Set E2B_API_KEY and E2B_TEMPLATE before running the live smoke test');
const provider = new E2BProvider(cfg);
const sandbox = await provider.create(60000);
try {
  let snapshot = await provider.seed(sandbox, { 'src/example.py': 'def answer(): return 42\n' });
  assert.equal(snapshot.files['src/example.py'], 'def answer(): return 42\n');
  snapshot = await provider.files(sandbox, { files: { ...snapshot.files, 'scratch.py': 'print(42)\n' }, revision: snapshot.revision });
  assert.equal(snapshot.conflict, undefined);
  let output = '';
  const pty = await provider.terminal(sandbox, data => { output += Buffer.from(data).toString(); });
  await sandbox.pty.sendInput(pty.pid, Buffer.from('python -c "print(6 * 7)"\r'));
  for (let n = 0; n < 30 && !output.includes('42'); n++) await new Promise(resolve => setTimeout(resolve, 100));
  assert.match(output, /42/);
  const checks = await sandbox.commands.run('/usr/bin/python3 -I -c \'import os; assert os.geteuid() != 0; assert not os.access("/opt/venv/bin/python", os.W_OK)\'', { user: 'user' });
  assert.equal(checks.exitCode, 0);
  const result = await provider.grade(sandbox, snapshot.files, [{ name: 'test_example.py', content: 'from src.example import answer\ndef test_answer(): assert answer() == 42\n' }]);
  assert.equal(result.passed, true, result.stderr + result.stdout);
  console.log('Live E2B file, PTY, non-root runtime and pytest smoke checks passed.');
} finally { await provider.kill(sandbox.sandboxId); }
