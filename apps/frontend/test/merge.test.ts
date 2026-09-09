import { expect, test } from 'vitest';
import { mergeFiles } from '../src/workspace/merge.ts';
test('independent edits and terminal file creation merge without lost work', () => {
  expect(mergeFiles({ a: 'old', b: 'old' }, { a: 'editor', b: 'old' }, { a: 'old', b: 'terminal', c: 'new' })).toEqual({ files: { a: 'editor', b: 'terminal', c: 'new' }, conflicts: [] });
});
test('concurrent edit and deletion require a choice', () => {
  expect(mergeFiles({ a: 'old' }, { a: 'editor' }, {})).toEqual({ files: { a: 'editor' }, conflicts: ['a'] });
});
test('identical edits and uncontested deletion do not conflict', () => {
  expect(mergeFiles({ a: 'old', b: 'old' }, { a: 'new', b: 'old' }, { a: 'new' })).toEqual({ files: { a: 'new' }, conflicts: [] });
});
