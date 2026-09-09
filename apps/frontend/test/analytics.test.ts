import { beforeEach, expect, test, vi } from 'vitest';

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

beforeEach(() => { storage.clear(); calls.length = 0; vi.restoreAllMocks(); });
test('analytics defaults off and withdrawal clears identifiers', () => {
  expect(analytics.analyticsConsent()).toBe(false);
  analytics.track('challenge_view','001-example');
  expect(calls).toHaveLength(0);
  analytics.setAnalyticsConsent(true);
  expect(analytics.analyticsConsent()).toBe(true);
  expect(analytics.eventSessionId()).toBeTruthy();
  expect(storage.getItem('heisenbug:visitor')).toBeTruthy();
  analytics.setAnalyticsConsent(false);
  expect(storage.getItem('heisenbug:visitor')).toBeNull();
  expect(storage.getItem('heisenbug:session')).toBeNull();
});

test('identifiers expire and duplicate session events are suppressed', () => {
  analytics.setAnalyticsConsent(true);
  let now = 1_800_000_000_000; vi.spyOn(Date, 'now').mockImplementation(() => now);
  const firstSession = analytics.eventSessionId(); const firstVisitor = JSON.parse(storage.getItem('heisenbug:visitor')!).id;
  analytics.track('practice_start','002-example'); analytics.track('practice_start','002-example');
  expect(calls).toHaveLength(1);
  now += 31 * 60_000;
  expect(analytics.eventSessionId()).not.toBe(firstSession);
  now += 91 * 86400_000;
  analytics.eventSessionId();
  expect(JSON.parse(storage.getItem('heisenbug:visitor')!).id).not.toBe(firstVisitor);
});
