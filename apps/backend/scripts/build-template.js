import { Template } from 'e2b';
import { readFile, writeFile } from 'node:fs/promises';
if (!process.env.E2B_API_KEY) throw new Error('Set E2B_API_KEY before building the template');
const dockerfile = await readFile(new URL('../sandbox/Dockerfile', import.meta.url), 'utf8');
const alias = process.env.E2B_TEMPLATE || 'heisenbug-python';
const memoryMB = Number(process.env.E2B_TEMPLATE_MEMORY_MB || 1024);
if (!Number.isInteger(memoryMB) || memoryMB < 1024) throw new Error('E2B_TEMPLATE_MEMORY_MB must be an integer of at least 1024');
const result = await Template.build(Template().fromDockerfile(dockerfile), { alias, cpuCount: 1, memoryMB });
const record = {
  builtAt: new Date().toISOString(),
  template: alias,
  templateId: result.templateId,
  memoryMB,
  sourceRevision: process.env.GITHUB_SHA || process.env.BUILD_SHA || null,
};
if (process.env.E2B_TEMPLATE_RECORD) await writeFile(process.env.E2B_TEMPLATE_RECORD, `${JSON.stringify(record, null, 2)}\n`);
console.log('Template built:', JSON.stringify(record));
