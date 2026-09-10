import { buildApp } from './app.js';
import { previewServer } from './execution/preview.js';
const app = await buildApp();
await app.execution.reconcile();
const preview = previewServer(app.execution, app.store, app.executionConfig);
await app.listen({ port: Number(process.env.PORT || 4001), host: '0.0.0.0' });
await new Promise((resolve, reject) => { preview.once('error', reject); preview.listen(app.executionConfig.previewPort, '0.0.0.0', resolve); });
const timer = setInterval(() => app.execution.sweep().catch(err => app.log.error({ err }, 'Cleanup failed')), 15000);
timer.unref();
let stopping = false;
const closePreview = () => new Promise(resolve => {
  let settled = false;
  const deadline = setTimeout(() => {
    preview.closeAllConnections?.();
    preview.destroyConnections?.();
    app.log.warn('Forced preview connection closure during shutdown');
    finish();
  }, 5000);
  const finish = () => {
    if (settled) return;
    settled = true;
    clearTimeout(deadline);
    resolve();
  };
  preview.close(error => {
    if (error && error.code !== 'ERR_SERVER_NOT_RUNNING') app.log.warn({ err: error }, 'Preview shutdown reported an error');
    finish();
  });
});
const shutdown = async () => {
  if (stopping) return;
  stopping = true;
  clearInterval(timer);
  await closePreview();
  await app.close();
  process.exit(0);
};
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, shutdown);
