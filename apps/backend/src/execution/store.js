import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
export const token = () => randomBytes(32).toString('base64url');
export const hash = value => createHash('sha256').update(value).digest('hex');
export function openStore(filename) {
  if (filename !== ':memory:') mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, login TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS logins (token TEXT PRIMARY KEY, user_id TEXT, expires INTEGER);
    CREATE TABLE IF NOT EXISTS oauth (token TEXT PRIMARY KEY, verifier TEXT, return_path TEXT, expires INTEGER);
    CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, user_id TEXT, sandbox_id TEXT, kind TEXT, started INTEGER, ended INTEGER, deadline INTEGER);
    CREATE TABLE IF NOT EXISTS tickets (token TEXT PRIMARY KEY, workspace_id TEXT, user_id TEXT, expires INTEGER);
    CREATE INDEX IF NOT EXISTS workspace_usage ON workspaces(user_id, started);`);
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL);`);
  const migrations = [
    `CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, request_id TEXT NOT NULL, user_id TEXT NOT NULL, challenge_id TEXT NOT NULL, session_id TEXT, created_at INTEGER NOT NULL, completed_at INTEGER, outcome TEXT NOT NULL CHECK (outcome IN ('pending','passed','failed','infrastructure_error')), UNIQUE(user_id, request_id)); CREATE INDEX IF NOT EXISTS submissions_challenge ON submissions(challenge_id, completed_at);`,
    `CREATE TABLE IF NOT EXISTS progress (user_id TEXT NOT NULL, challenge_id TEXT NOT NULL, imported INTEGER NOT NULL DEFAULT 0, verified INTEGER NOT NULL DEFAULT 0, first_verified_at INTEGER, PRIMARY KEY(user_id, challenge_id));`,
    `CREATE TABLE IF NOT EXISTS analytics_events (id TEXT PRIMARY KEY, visitor_id TEXT, session_id TEXT, user_id TEXT, challenge_id TEXT NOT NULL, event_type TEXT NOT NULL CHECK(event_type IN ('challenge_view','practice_start')), received_at INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS analytics_events_retention ON analytics_events(received_at);`,
    `CREATE TABLE IF NOT EXISTS workspace_starts (workspace_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, challenge_id TEXT NOT NULL, session_id TEXT, started_at INTEGER NOT NULL, successful INTEGER NOT NULL DEFAULT 0);`
  ];
  for (let i = 0; i < migrations.length; i++) {
    const version = i + 1;
    if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version=?').get(version)) {
      db.exec('BEGIN');
      try { db.exec(migrations[i]); db.prepare('INSERT INTO schema_migrations VALUES (?,?)').run(version, Date.now()); db.exec('COMMIT'); }
      catch (error) { db.exec('ROLLBACK'); throw error; }
    }
  }
  if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version=5').get()) {
    db.exec('BEGIN');
    try {
      const submissionColumns = new Set(db.prepare('PRAGMA table_info(submissions)').all().map(row => row.name));
      const startColumns = new Set(db.prepare('PRAGMA table_info(workspace_starts)').all().map(row => row.name));
      if (!submissionColumns.has('session_id')) db.exec('ALTER TABLE submissions ADD COLUMN session_id TEXT');
      if (!startColumns.has('session_id')) db.exec('ALTER TABLE workspace_starts ADD COLUMN session_id TEXT');
      db.prepare('INSERT INTO schema_migrations VALUES (?,?)').run(5, Date.now());
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  /* Legacy installations may have the tables from the pre-versioned prototype. */
  db.exec(`
    CREATE INDEX IF NOT EXISTS submissions_challenge ON submissions(challenge_id, completed_at);
    CREATE INDEX IF NOT EXISTS analytics_events_retention ON analytics_events(received_at);`);
  db.prepare(`UPDATE submissions SET outcome='infrastructure_error', completed_at=? WHERE outcome='pending'`).run(Date.now());
  return db;
}
