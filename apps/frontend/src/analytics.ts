const API_BASE = import.meta.env?.VITE_API_BASE ?? 'http://localhost:4001';

const PREF = 'heisenbug:analytics-consent';
const VISITOR = 'heisenbug:visitor';
const SESSION = 'heisenbug:session';
const SESSION_IDLE = 30 * 60_000;
type Stored = { id: string; at: number };

function uuid() { return crypto.randomUUID(); }
function read(key: string): Stored | null { try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v?.id && typeof v.at === 'number' ? v : null; } catch { return null; } }
export function analyticsConsent() { return localStorage.getItem(PREF) === 'accepted'; }
export function setAnalyticsConsent(accepted: boolean) {
  localStorage.setItem(PREF, accepted ? 'accepted' : 'declined');
  if (!accepted) { localStorage.removeItem(VISITOR); localStorage.removeItem(SESSION); }
}
function identifiers() {
  if (!analyticsConsent()) return null;
  const now = Date.now();
  let visitor = read(VISITOR);
  if (!visitor || now - visitor.at > 90 * 86400_000) visitor = { id: uuid(), at: now };
  let session = read(SESSION);
  if (!session || now - session.at > SESSION_IDLE) session = { id: uuid(), at: now };
  session.at = now;
  localStorage.setItem(VISITOR, JSON.stringify(visitor)); localStorage.setItem(SESSION, JSON.stringify(session));
  return { visitorId: visitor.id, sessionId: session.id };
}
const sent = new Set<string>();
export function track(type: 'challenge_view' | 'practice_start', challengeId: string) {
  const ids = identifiers(); if (!ids) return;
  const key = `${type}:${challengeId}:${ids.sessionId}`; if (sent.has(key)) return; sent.add(key);
  const options = { method: 'POST', credentials: 'include' as const, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events: [{ id: uuid(), type, challengeId, ...ids }] }) };
  void fetch(`${API_BASE}/api/analytics/events`, options).catch(() => fetch(`${API_BASE}/api/analytics/events`, options)).catch(() => {});
}
export function eventSessionId() { return identifiers()?.sessionId; }
