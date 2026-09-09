import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import websocket from '@fastify/websocket';
import { listChallenges, getChallenge, getExplanation, getSolutionWriteup } from './challenges.js';
import { config } from './execution/config.js';
import { openStore } from './execution/store.js';
import { registerAuth } from './execution/auth.js';
import { E2BProvider } from './execution/provider.js';
import { ExecutionService } from './execution/service.js';
import { registerExecution } from './execution/routes.js';
import { registerProgress } from './progress.js';
import { registerAnalytics } from './analytics.js';
export async function buildApp(options = {}) {
  const cfg = options.config || config();
  const app = Fastify({ logger: options.logger ?? true, bodyLimit: 1500000, disableRequestLogging: true });
  const db = options.db || openStore(cfg.dbPath);
  await app.register(cors, { origin: cfg.appOrigin, credentials: true });
  await app.register(cookie);
  await app.register(websocket, { options: { maxPayload: 20000 } });
  const requests = new Map();
  app.addHook('onRequest', async (req, reply) => {
    const now = Date.now();
    const bucket = Math.floor(now / 60000);
    for (const [key, value] of requests) if (value.bucket !== bucket) requests.delete(key);
    const key = req.ip;
    if (!requests.has(key) && requests.size >= 10000) return reply.code(429).send({ error: 'Server is busy; retry shortly' });
    const entry = requests.get(key) || { bucket, count: 0, oauth: 0 };
    entry.count++;
    if (req.url.startsWith('/api/auth/github')) entry.oauth++;
    requests.set(key, entry);
    if (entry.count > 300 || entry.oauth > 10) return reply.header('Retry-After', '60').code(429).send({ error: 'Too many requests; retry in one minute' });
  });
  app.setErrorHandler((err, req, reply) => {
    const status = err.statusCode || 502;
    if (status >= 500) req.log.error({ err }, 'Request failed');
    reply.code(status).send({ error: status >= 500 && !err.statusCode ? 'Execution service unavailable; please retry.' : err.message });
  });
  app.get('/api/health', async () => ({ ok: true, executionEnabled: cfg.enabled }));
  app.get('/api/challenges', listChallenges);
  for (const [suffix, reader, field] of [['', getChallenge, null], ['/explanation', getExplanation, 'markdown'], ['/solution-writeup', getSolutionWriteup, 'markdown']]) {
    app.get(`/api/challenges/:id${suffix}`, async (req, reply) => {
      try { const result = await reader(req.params.id); return field ? { [field]: result } : result; }
      catch { return reply.code(404).send({ error: 'Challenge content not found' }); }
    });
  }
  const service = new ExecutionService(db, cfg, options.provider || new E2BProvider(cfg), app.log);
  const auth = registerAuth(app, db, cfg, async userId => {
    for (const session of service.sessions.values()) if (session.userId === userId) await service.stop(session);
  });
  registerExecution(app, service, auth, cfg, db);
  registerProgress(app, auth, db, cfg);
  registerAnalytics(app, auth, db, cfg);
  app.decorate('execution', service); app.decorate('store', db); app.decorate('executionConfig', cfg);
  app.addHook('onClose', async () => {
    await Promise.allSettled([...service.sessions.values()].map(s => service.stop(s)));
    db.close();
  });
  return app;
}
