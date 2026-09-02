import { readdir, readFile, mkdtemp, mkdir, writeFile, cp } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const CHALLENGES_DIR = path.resolve(import.meta.dirname, "../../../challenges");

export async function listChallenges() {
  const entries = await readdir(CHALLENGES_DIR, { withFileTypes: true });
  const metas = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const metaPath = path.join(CHALLENGES_DIR, entry.name, "meta.json");
    try {
      const raw = await readFile(metaPath, "utf-8");
      metas.push(JSON.parse(raw));
    } catch {
      // skip folders without a meta.json
    }
  }
  return metas;
}

export async function getChallenge(id) {
  const dir = path.join(CHALLENGES_DIR, `challenge-${id}`);
  const meta = JSON.parse(await readFile(path.join(dir, "meta.json"), "utf-8"));

  const files = {};
  for (const relPath of meta.filesVisible) {
    files[relPath] = await readFile(path.join(dir, "starter", relPath), "utf-8");
  }

  return { meta, files };
}

export async function getExplanation(id) {
  const dir = path.join(CHALLENGES_DIR, `challenge-${id}`);
  return readFile(path.join(dir, "explanation.md"), "utf-8");
}

export async function getSolutionWriteup(id) {
  const dir = path.join(CHALLENGES_DIR, `challenge-${id}`);
  return readFile(path.join(dir, "solution.md"), "utf-8");
}

export function challengeDir(id) {
  return path.join(CHALLENGES_DIR, `challenge-${id}`);
}

export { CHALLENGES_DIR };
