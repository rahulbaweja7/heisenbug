import test from 'node:test';
import assert from 'node:assert/strict';

class Storage {
  values = new Map<string,string>();
  getItem(key:string) { return this.values.get(key) ?? null; }
  setItem(key:string,value:string) { this.values.set(key,String(value)); }
  removeItem(key:string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}
const storage = new Storage();
Object.defineProperty(globalThis, 'localStorage', { value: storage });
const calls: Array<{ body?: BodyInit | null }> = [];
Object.defineProperty(globalThis, 'fetch', { value: async (_url:string, options:RequestInit) => { calls.push(options); return new Response('{}'); }, writable:true });
const analytics = await import('../src/analytics.ts');

test('analytics defaults off and withdrawal clears identifiers', () => {
  storage.clear(); calls.length = 0;
  assert.equal(analytics.analyticsConsent(), false);
  analytics.track('challenge_view','001-example');
  assert.equal(calls.length, 0);
  analytics.setAnalyticsConsent(true);
  assert.equal(analytics.analyticsConsent(), true);
  assert.ok(analytics.eventSessionId());
  assert.ok(storage.getItem('heisenbug:visitor'));
  analytics.setAnalyticsConsent(false);
  assert.equal(storage.getItem('heisenbug:visitor'), null);
  assert.equal(storage.getItem('heisenbug:session'), null);
});

test('identifiers expire and duplicate session events are suppressed', async t => {
  storage.clear(); calls.length = 0; analytics.setAnalyticsConsent(true);
  let now = 1_800_000_000_000; t.mock.method(Date, 'now', () => now);
  const firstSession = analytics.eventSessionId(); const firstVisitor = JSON.parse(storage.getItem('heisenbug:visitor')!).id;
  analytics.track('practice_start','002-example'); analytics.track('practice_start','002-example');
  assert.equal(calls.length, 1);
  now += 31 * 60_000;
  assert.notEqual(analytics.eventSessionId(), firstSession);
  now += 91 * 86400_000;
  analytics.eventSessionId();
  assert.notEqual(JSON.parse(storage.getItem('heisenbug:visitor')!).id, firstVisitor);
});
