import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildApp } from '../src/app.js';
import { config } from '../src/execution/config.js';
import { hash, openStore } from '../src/execution/store.js';

const challengeId = '001-off-by-one-inventory';
const files = { 'src/inventory.py': 'def remaining(items):\n    return len(items)\n' };
class Provider {
  constructor() { this.created = 0; this.killed = 0; this.result = { passed: true, stdout: 'ok', stderr: '' }; }
  async create() { this.created++; return { sandboxId: `sandbox-${this.created}` }; }
  async seed(_sandbox, entries) { return { files: entries, revision: '1' }; }
  async grade() { if (this.error) throw this.error; return this.result; }
  async kill() { this.killed++; }
}
async function setup(t, provider = new Provider()) {
  const cfg = { ...config(), enabled: true, dbPath: ':memory:', adminGithubIds: new Set(['one']) };
  const app = await buildApp({ config: cfg, provider, logger: false });
  for (const id of ['one','two']) { app.store.prepare('INSERT INTO users VALUES (?,?)').run(id,id); app.store.prepare('INSERT INTO logins VALUES (?,?,?)').run(hash(id),id,Date.now()+60000); }
  t.after(() => app.close());
  const request = (method, url, payload, user = 'one', origin = cfg.appOrigin) => app.inject({ method, url, payload, headers: { origin, cookie: `hb_session=${user}` } });
  return { app, provider, request, cfg };
}

test('migrations are repeatable and recover pending submissions', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'heisenbug-store-')); const filename = path.join(dir, 'db.sqlite');
  try {
    const first = openStore(filename);
    first.prepare("INSERT INTO submissions(id,request_id,user_id,challenge_id,created_at,outcome) VALUES ('s','r','u','c',1,'pending')").run();
    assert.equal(first.prepare('SELECT COUNT(*) n FROM schema_migrations').get().n, 5); first.close();
    const second = openStore(filename);
    assert.equal(second.prepare("SELECT outcome FROM submissions WHERE id='s'").get().outcome, 'infrastructure_error');
    assert.equal(second.prepare('SELECT COUNT(*) n FROM schema_migrations').get().n, 5); second.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('progress import is isolated, validated, idempotent, and upgrades to verified', async t => {
  const { app, provider, request } = await setup(t);
  assert.equal((await request('POST','/api/progress/import',{ challengeIds:[challengeId,challengeId] })).json().imported, 1);
  assert.equal((await request('POST','/api/progress/import',{ challengeIds:['missing'] })).statusCode, 400);
  assert.equal((await request('GET','/api/progress',undefined,'two')).json().challenges.length, 0);
  const payload = { files, requestId:'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', analyticsSessionId:'session_12345678' };
  const first = await request('POST',`/api/challenges/${challengeId}/submit`,payload);
  const retry = await request('POST',`/api/challenges/${challengeId}/submit`,payload);
  assert.equal(first.statusCode, 200, first.body); assert.equal(first.json().passed, true); assert.equal(retry.json().submissionId, first.json().submissionId); assert.equal(provider.created, 1);
  provider.result = { passed:false, stdout:'', stderr:'failed' };
  await request('POST',`/api/challenges/${challengeId}/submit`,{ ...payload, requestId:'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb' });
  const progress = (await request('GET','/api/progress')).json().challenges[0];
  assert.equal(progress.verified, 1); assert.equal(progress.completed_attempts, 2); assert.ok(progress.first_verified_at);
});

test('rejected grading is not counted and provider failure is infrastructure error', async t => {
  const provider = new Provider(); const { app, request } = await setup(t, provider);
  assert.equal((await request('POST',`/api/challenges/${challengeId}/submit`,{ files:null, requestId:'cccccccc-cccc-4ccc-cccc-cccccccccccc' })).statusCode, 400);
  assert.equal(app.store.prepare('SELECT COUNT(*) n FROM submissions').get().n, 0);
  provider.error = new Error('provider offline');
  const failed = await request('POST',`/api/challenges/${challengeId}/submit`,{ files, requestId:'dddddddd-dddd-4ddd-dddd-dddddddddddd' }); assert.equal(failed.statusCode, 502, failed.body);
  assert.equal(app.store.prepare('SELECT outcome FROM submissions').get().outcome, 'infrastructure_error');
});

test('analytics consent events deduplicate and admin metrics enforce access', async t => {
  const { app, request, cfg } = await setup(t); const now = Date.now();
  const event = { id:'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee', visitorId:'visitor_12345678', sessionId:'session_12345678', challengeId, type:'challenge_view' };
  assert.equal((await request('POST','/api/analytics/events',{ events:[event] })).json().accepted.length, 1);
  assert.equal((await request('POST','/api/analytics/events',{ events:[event] })).json().accepted.length, 0);
  app.store.prepare("INSERT INTO analytics_events VALUES (?,?,?,?,?,?,?)").run('ffffffff-ffff-4fff-ffff-ffffffffffff','visitor_12345678','session_87654321',null,challengeId,'practice_start',now);
  const viewedAt = app.store.prepare('SELECT received_at FROM analytics_events WHERE id=?').get(event.id).received_at;
  app.store.prepare("INSERT INTO submissions(id,request_id,user_id,challenge_id,session_id,created_at,completed_at,outcome) VALUES (?,?,?,?,?,?,?,?)").run('s2','r2','one',challengeId,'session_12345678',viewedAt,viewedAt + 1,'passed');
  assert.equal((await request('GET','/api/admin/analytics',undefined,'two')).statusCode, 403);
  const report = (await request('GET','/api/admin/analytics')).json();
  assert.ok(report.challenges.length, JSON.stringify(report)); assert.equal(report.challenges[0].views, 1); assert.equal(report.challenges[0].pass_rate, 1);
  assert.equal(report.consented_funnel.converted_sessions, 1); assert.ok(report.daily.length >= 29);
  assert.equal((await request('GET','/api/admin/analytics?from=2026-01-01&to=2026-05-01')).statusCode, 400);
  app.store.prepare('UPDATE analytics_events SET received_at=?').run(now - 91*86400000); await app.execution.sweep();
  assert.equal(app.store.prepare('SELECT COUNT(*) n FROM analytics_events').get().n, 0);
  assert.equal((await request('POST','/api/analytics/events',{ events:[] },'one','https://evil.invalid')).statusCode, 403);
  assert.equal(cfg.adminGithubIds.has('one'), true);
});
