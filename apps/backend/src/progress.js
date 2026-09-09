import { listChallenges } from './challenges.js';
import { fail } from './execution/config.js';

const validId = value => typeof value === 'string' && /^[a-zA-Z0-9-]{1,120}$/.test(value);

export function registerProgress(app, auth, db, cfg) {
  const user = req => auth.requireUser(req);
  app.get('/api/progress', async req => {
    const identity = user(req);
    const rows = db.prepare(`WITH ids AS (
      SELECT challenge_id FROM progress WHERE user_id=?
      UNION SELECT challenge_id FROM submissions WHERE user_id=? AND outcome IN ('passed','failed')
    ) SELECT ids.challenge_id, COALESCE(p.imported,0) imported, COALESCE(p.verified,0) verified,
      p.first_verified_at, (SELECT COUNT(*) FROM submissions s WHERE s.user_id=? AND s.challenge_id=ids.challenge_id AND s.outcome IN ('passed','failed')) completed_attempts
      FROM ids LEFT JOIN progress p ON p.user_id=? AND p.challenge_id=ids.challenge_id`).all(identity.id, identity.id, identity.id, identity.id);
    return { challenges: rows, isAdmin: cfg.adminGithubIds.has(String(identity.id)) };
  });
  app.post('/api/progress/import', async req => {
    const identity = user(req); auth.origin(req);
    const ids = req.body?.challengeIds;
    if (!Array.isArray(ids) || ids.length > 100 || ids.some(id => !validId(id))) throw fail(400, 'Invalid challenge IDs');
    const known = new Set((await listChallenges()).map(challenge => challenge.id));
    if (ids.some(id => !known.has(id))) throw fail(400, 'Unknown challenge ID');
    db.exec('BEGIN');
    try {
      const insert = db.prepare('INSERT INTO progress(user_id,challenge_id,imported) VALUES(?,?,1) ON CONFLICT(user_id,challenge_id) DO UPDATE SET imported=CASE WHEN progress.verified=1 THEN progress.imported ELSE 1 END');
      for (const id of new Set(ids)) insert.run(identity.id, id);
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
    return { ok: true, imported: new Set(ids).size };
  });
}

export function recordVerified(db, userId, challengeId, at = Date.now()) {
  db.prepare(`INSERT INTO progress(user_id,challenge_id,verified,first_verified_at) VALUES(?,?,1,?)
    ON CONFLICT(user_id,challenge_id) DO UPDATE SET verified=1, first_verified_at=COALESCE(progress.first_verified_at, excluded.first_verified_at)`).run(userId, challengeId, at);
}
