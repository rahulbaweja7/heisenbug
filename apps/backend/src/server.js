import { buildApp } from './app.js';
import { previewServer } from './execution/preview.js';
const app = await buildApp();
await app.execution.reconcile();
const preview = previewServer(app.execution, app.store, app.executionConfig);
await app.listen({ port: Number(process.env.PORT || 4001), host: '0.0.0.0' });
await new Promise((resolve, reject) => { preview.once('error', reject); preview.listen(app.executionConfig.previewPort, '0.0.0.0', resolve); });
const timer = setInterval(() => app.execution.sweep().catch(err => app.log.error({ err }, 'Cleanup failed')), 15000);
timer.unref();
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => {
  clearInterval(timer); preview.close();
  await app.close(); process.exit(0);
});
