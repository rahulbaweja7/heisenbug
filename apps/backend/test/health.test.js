import test from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { config } from '../src/execution/config.js';

test('health reports execution state and the immutable build revision', async t => {
  const app = await buildApp({
    config: { ...config({}), dbPath: ':memory:' },
    provider: {},
    logger: false,
    revision: '0123456789abcdef0123456789abcdef01234567',
  });
  t.after(() => app.close());

  const response = await app.inject('/api/health');
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    ok: true,
    executionEnabled: false,
    revision: '0123456789abcdef0123456789abcdef01234567',
  });
});
