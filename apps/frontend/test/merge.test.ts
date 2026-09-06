import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeFiles } from '../src/workspace/merge.ts';
test('independent edits and terminal file creation merge without lost work', () => {
  assert.deepEqual(mergeFiles({ a: 'old', b: 'old' }, { a: 'editor', b: 'old' }, { a: 'old', b: 'terminal', c: 'new' }), { files: { a: 'editor', b: 'terminal', c: 'new' }, conflicts: [] });
});
test('concurrent edit and deletion require a choice', () => {
  assert.deepEqual(mergeFiles({ a: 'old' }, { a: 'editor' }, {}), { files: { a: 'editor' }, conflicts: ['a'] });
});
test('identical edits and uncontested deletion do not conflict', () => {
  assert.deepEqual(mergeFiles({ a: 'old', b: 'old' }, { a: 'new', b: 'old' }, { a: 'new' }), { files: { a: 'new' }, conflicts: [] });
});
