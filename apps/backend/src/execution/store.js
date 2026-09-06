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
  return db;
}
