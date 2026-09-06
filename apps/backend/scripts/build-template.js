import { Template } from 'e2b';
import { readFile } from 'node:fs/promises';
if (!process.env.E2B_API_KEY) throw new Error('Set E2B_API_KEY before building the template');
const dockerfile = await readFile(new URL('../sandbox/Dockerfile', import.meta.url), 'utf8');
const result = await Template.build(Template().fromDockerfile(dockerfile), { alias: process.env.E2B_TEMPLATE || 'heisenbug-python', cpuCount: 1, memoryMB: 512 });
console.log('Template built:', result.templateId);
