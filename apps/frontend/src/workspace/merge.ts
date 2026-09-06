import type { Files } from './api';
export function mergeFiles(base: Files, local: Files, remote: Files) {
  const files: Files = {};
  const conflicts: string[] = [];
  for (const name of new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)])) {
    const changedHere = local[name] !== base[name];
    const changedThere = remote[name] !== base[name];
    if (changedHere && changedThere && local[name] !== remote[name]) conflicts.push(name);
    const value = changedHere ? local[name] : remote[name];
    if (value !== undefined) files[name] = value;
  }
  return { files, conflicts };
}
export const sameFiles = (a: Files, b: Files) => Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => a[key] === b[key]);
