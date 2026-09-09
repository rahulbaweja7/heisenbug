import { getChallenge } from './challenges.js';
import { fail } from './execution/config.js';

const id = value => typeof value === 'string' && /^[A-Za-z0-9_-]{8,100}$/.test(value);
const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
export function registerAnalytics(app, auth, db, cfg) {
  const limits = new Map();
  app.post('/api/analytics/events', async req => {
    auth.origin(req);
    const key = req.ip, now = Date.now(), prior = limits.get(key) || { at: now, count: 0 };
    if (now - prior.at > 60000) { prior.at = now; prior.count = 0; }
    prior.count += 1; limits.set(key, prior);
    if (prior.count > 120) throw fail(429, 'Analytics rate limit exceeded');
    const events = req.body?.events;
    if (!Array.isArray(events) || events.length < 1 || events.length > 50) throw fail(400, 'Invalid analytics batch');
    for (const event of events) {
      if (!event || !id(event.id) || !id(event.visitorId) || !id(event.sessionId) || !['challenge_view','practice_start'].includes(event.type) || typeof event.challengeId !== 'string') throw fail(400, 'Invalid analytics event');
      await getChallenge(event.challengeId).catch(() => { throw fail(400, 'Unknown challenge'); });
    }
    const user = auth.user(req), insert = db.prepare('INSERT OR IGNORE INTO analytics_events(id,visitor_id,session_id,user_id,challenge_id,event_type,received_at) VALUES (?,?,?,?,?,?,?)');
    const accepted = [];
    db.exec('BEGIN');
    try { for (const event of events) { const result = insert.run(event.id, event.visitorId, event.sessionId, user?.id || null, event.challengeId, event.type, now); if (result.changes) accepted.push(event.id); } db.exec('COMMIT'); }
    catch (error) { db.exec('ROLLBACK'); throw error; }
    return { accepted };
  });
  app.get('/api/admin/analytics', async req => {
    const user = auth.requireUser(req);
    if (!cfg.adminGithubIds.has(String(user.id))) throw fail(403, 'Administrator access required');
    const today = new Date(); const endDefault = today.toISOString().slice(0, 10); const startDate = new Date(today - 29 * 86400000); const startDefault = startDate.toISOString().slice(0, 10);
    const from = req.query?.from || startDefault, to = req.query?.to || endDefault;
    if (!date(from) || !date(to) || from > to) throw fail(400, 'Invalid date range');
    const lo = Date.parse(`${from}T00:00:00Z`), hi = Date.parse(`${to}T00:00:00Z`) + 86400000;
    if (hi - lo > 90 * 86400000) throw fail(400, 'Date range cannot exceed 90 days');
    const events = db.prepare('SELECT challenge_id,event_type,session_id,visitor_id,received_at FROM analytics_events WHERE received_at>=? AND received_at<?').all(lo, hi);
    const retainedEvents = db.prepare('SELECT visitor_id,session_id,MIN(received_at) first_seen FROM analytics_events WHERE received_at<? GROUP BY visitor_id,session_id').all(hi);
    const submissions = db.prepare('SELECT challenge_id,outcome,completed_at,user_id,session_id FROM submissions WHERE completed_at>=? AND completed_at<?').all(lo, hi);
    const starts = db.prepare('SELECT challenge_id,started_at,session_id FROM workspace_starts WHERE successful=1 AND started_at>=? AND started_at<?').all(lo, hi);
    const rows = new Map();
    const get = challengeId => rows.get(challengeId) || { challenge_id: challengeId, views: 0, practice_starts: 0, successful_workspace_starts: 0, completed_submissions: 0, passing_submissions: 0, unique_verified_solvers: 0, infrastructure_errors: 0, pass_rate: null, tracked_session_conversion: null };
    for (const e of events) { const row = get(e.challenge_id); row[e.event_type === 'challenge_view' ? 'views' : 'practice_starts']++; rows.set(e.challenge_id, row); }
    for (const s of starts) { const row = get(s.challenge_id); row.successful_workspace_starts++; rows.set(s.challenge_id, row); }
    const solverSets = new Map();
    for (const s of submissions) {
      const row = get(s.challenge_id);
      if (s.outcome === 'passed' || s.outcome === 'failed') row.completed_submissions++;
      if (s.outcome === 'passed') { row.passing_submissions++; const set = solverSets.get(s.challenge_id) || new Set(); set.add(s.user_id); solverSets.set(s.challenge_id, set); }
      if (s.outcome === 'infrastructure_error') row.infrastructure_errors++;
      rows.set(s.challenge_id, row);
    }
    const viewedPairs = new Map();
    for (const event of events.filter(event => event.event_type === 'challenge_view')) viewedPairs.set(`${event.challenge_id}:${event.session_id}`, Math.min(viewedPairs.get(`${event.challenge_id}:${event.session_id}`) ?? Infinity, event.received_at));
    const convertedPairs = new Set(submissions.filter(item => item.session_id && ['passed','failed'].includes(item.outcome) && item.completed_at >= (viewedPairs.get(`${item.challenge_id}:${item.session_id}`) ?? Infinity)).map(item => `${item.challenge_id}:${item.session_id}`));
    for (const [challengeId, row] of rows) {
      row.unique_verified_solvers = solverSets.get(challengeId)?.size || 0;
      row.pass_rate = row.completed_submissions ? row.passing_submissions / row.completed_submissions : null;
      const pairs = [...viewedPairs.keys()].filter(key => key.startsWith(`${challengeId}:`));
      row.tracked_session_conversion = pairs.length ? pairs.filter(key => convertedPairs.has(key)).length / pairs.length : null;
    }
    const day = timestamp => new Date(timestamp).toISOString().slice(0, 10);
    const daily = [];
    for (let cursor = lo; cursor < hi; cursor += 86400000) daily.push({ date: day(cursor), views: 0, practice_starts: 0, successful_workspace_starts: 0, completed_submissions: 0, passing_submissions: 0, infrastructure_errors: 0 });
    const dailyByDate = new Map(daily.map(value => [value.date, value]));
    for (const event of events) dailyByDate.get(day(event.received_at))[event.event_type === 'challenge_view' ? 'views' : 'practice_starts']++;
    for (const start of starts) dailyByDate.get(day(start.started_at)).successful_workspace_starts++;
    for (const submission of submissions) { const value = dailyByDate.get(day(submission.completed_at)); if (['passed','failed'].includes(submission.outcome)) value.completed_submissions++; if (submission.outcome === 'passed') value.passing_submissions++; if (submission.outcome === 'infrastructure_error') value.infrastructure_errors++; }
    const earliestByVisitor = new Map();
    for (const event of retainedEvents) earliestByVisitor.set(event.visitor_id, Math.min(earliestByVisitor.get(event.visitor_id) ?? Infinity, event.first_seen));
    const periodSessions = new Map();
    for (const event of events) periodSessions.set(`${event.visitor_id}:${event.session_id}`, { visitor: event.visitor_id, first: Math.min(periodSessions.get(`${event.visitor_id}:${event.session_id}`)?.first ?? Infinity, event.received_at) });
    const returningVisitors = new Set([...periodSessions.values()].filter(value => earliestByVisitor.get(value.visitor) < value.first).map(value => value.visitor)).size;
    const completed = submissions.filter(item => ['passed','failed'].includes(item.outcome)).length;
    return {
      from, to, daily, challenges: [...rows.values()],
      grading_totals: { completed_submissions: completed, passing_submissions: submissions.filter(item => item.outcome === 'passed').length, infrastructure_errors: submissions.filter(item => item.outcome === 'infrastructure_error').length },
      consented_funnel: { tracked_visitors: new Set(events.map(item => item.visitor_id)).size, returning_visitors: returningVisitors, viewed_sessions: viewedPairs.size, converted_sessions: convertedPairs.size },
      definitions: { pass_rate: 'passing submissions / completed submissions', tracked_session_conversion: 'viewed challenge/session pairs with a later completed submission for that challenge and session', returning_visitors: 'consented visitors with an earlier tracked session in retained history' }
    };
  });
}
