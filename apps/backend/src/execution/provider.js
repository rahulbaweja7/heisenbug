import { Sandbox } from 'e2b';
import { readFile } from 'node:fs/promises';
import { fail } from './config.js';
const bridge = await readFile(new URL('./workspace_files.py', import.meta.url), 'utf8');
const quoted = value => `'${value.replaceAll("'", "'\\''")}'`;
export class E2BProvider {
  constructor(cfg) { this.cfg = cfg; }
  async create(timeoutMs) {
    if (!this.cfg.apiKey || !this.cfg.template) throw fail(503, 'Sandbox service is not configured');
    return Sandbox.create(this.cfg.template, { apiKey: this.cfg.apiKey, timeoutMs, requestTimeoutMs: 15000, allowInternetAccess: false, network: { allowPublicTraffic: false }, metadata: { app: 'heisenbug' } });
  }
  async kill(id) { await Sandbox.kill(id, { apiKey: this.cfg.apiKey, requestTimeoutMs: 10000 }); }
  async files(sandbox, payload = {}) {
    const arg = Buffer.from(JSON.stringify(payload)).toString('base64');
    const result = await sandbox.commands.run(`/usr/bin/python3 -I -c ${quoted(bridge)} ${quoted(arg)}`, { user: 'user', cwd: '/', timeoutMs: 10000 });
    return JSON.parse(result.stdout);
  }
  async seed(sandbox, files) {
    const initial = await this.files(sandbox);
    return this.files(sandbox, { files, revision: initial.revision });
  }
  async terminal(sandbox, onData) {
    return sandbox.pty.create({ cols: 100, rows: 24, user: 'user', cwd: '/workspace', timeoutMs: 0, onData });
  }
  async grade(sandbox, files, tests) {
    await this.seed(sandbox, files);
    await sandbox.files.makeDir('/grading/tests', { user: 'root' });
    await sandbox.files.write(tests.map(t => ({ path: `/grading/tests/${t.name}`, data: t.content })), { user: 'root' });
    let stdout = '', stderr = '', outputBytes = 0, exceeded = false;
    const cap = (old, chunk) => {
      outputBytes += Buffer.byteLength(chunk);
      if (outputBytes > 50000 && !exceeded) { exceeded = true; sandbox.kill().catch(() => {}); }
      return (old + chunk).slice(0, 50000);
    };
    try {
      const result = await sandbox.commands.run('cd /grading && PYTHONPATH=/workspace /opt/venv/bin/python -m pytest tests -v --tb=short -p no:cacheprovider', { user: 'user', timeoutMs: 10000, onStdout: chunk => { stdout = cap(stdout, chunk); }, onStderr: chunk => { stderr = cap(stderr, chunk); } });
      return { passed: result.exitCode === 0, stdout, stderr };
    } catch (error) {
      if (exceeded) return { passed: false, stdout, stderr: stderr + '\nExecution stopped: output exceeded 50 KB.' };
      if (typeof error.exitCode === 'number') return { passed: false, stdout, stderr: stderr || 'Tests exited unsuccessfully.' };
      if (/timeout/i.test(error.name + error.message)) return { passed: false, stdout, stderr: stderr + '\nTests exceeded the 10-second limit.' };
      throw error;
    }
  }
}
