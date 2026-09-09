export const fail = (statusCode, message) => Object.assign(new Error(message), { statusCode });
export function config(env = process.env) {
  const positive = (name, fallback) => {
    const value = Number(env[name] || fallback);
    if (!Number.isFinite(value) || value <= 0) throw new Error(`Invalid ${name}`);
    return value;
  };
  return {
    enabled: env.EXECUTION_ENABLED === 'true',
    appOrigin: env.APP_ORIGIN || 'http://localhost:5173',
    apiOrigin: env.API_ORIGIN || 'http://localhost:4001',
    previewOrigin: env.PREVIEW_ORIGIN || 'http://localhost:4002',
    previewPort: positive('PREVIEW_PORT', 4002),
    dbPath: env.DATABASE_PATH || './data/heisenbug.sqlite',
    template: env.E2B_TEMPLATE || '', apiKey: env.E2B_API_KEY || '',
    clientId: env.GITHUB_CLIENT_ID || '', clientSecret: env.GITHUB_CLIENT_SECRET || '',
    adminGithubIds: new Set(String(env.ADMIN_GITHUB_IDS || '').split(',').map(value => value.trim()).filter(Boolean)),
    maxSessions: positive('MAX_SANDBOXES', 10),
    idleMs: positive('WORKSPACE_IDLE_MINUTES', 10) * 60000,
    maxMs: positive('WORKSPACE_MAX_MINUTES', 60) * 60000,
    dailyMs: positive('WORKSPACE_DAILY_MINUTES', 120) * 60000,
  };
}
export function validateFiles(files) {
  if (!files || typeof files !== 'object' || Array.isArray(files)) throw fail(400, 'Expected a files object');
  const entries = Object.entries(files);
  if (entries.length > 200) throw fail(413, 'Maximum 200 files');
  let bytes = 0;
  for (const [name, content] of entries) {
    if (name.length > 240 || !/^[a-zA-Z0-9_./-]+$/.test(name) || name.split('/').some(p => !p || p.startsWith('.') || ['__proto__', 'constructor', 'prototype', '__pycache__', 'node_modules'].includes(p)) || /^tests(\/|$)/.test(name)) throw fail(400, 'Invalid workspace path');
    if (name.split('/').slice(0, -1).some((_, index) => Object.hasOwn(files, name.split('/').slice(0, index + 1).join('/')))) throw fail(400, 'A file cannot also be a directory');
    if (typeof content !== 'string' || content.includes('\0') || Buffer.byteLength(content) > 100000) throw fail(413, 'Files must be text, at most 100 KB each');
    bytes += Buffer.byteLength(content);
  }
  if (bytes > 1000000) throw fail(413, 'Workspace exceeds 1 MB');
  return files;
}
