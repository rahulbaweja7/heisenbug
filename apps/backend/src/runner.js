import { mkdtemp, mkdir, writeFile, cp, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import os from "node:os";
import { challengeDir } from "./challenges.js";

// NOTE: this runs pytest as a local subprocess for the walking-skeleton demo
// only. It executes user-submitted code directly on this machine with no
// sandboxing. Per the project plan (section 5.2), this MUST be replaced with
// Judge0 or an isolated Docker sandbox (no network, CPU/memory/time limits)
// before this ever runs against untrusted/public submissions.

const TIMEOUT_MS = 10_000;
const MAX_OUTPUT_BYTES = 50_000;

function capOutput(text) {
  if (text.length <= MAX_OUTPUT_BYTES) return text;
  return (
    text.slice(0, MAX_OUTPUT_BYTES) +
    `\n\n[output truncated — exceeded ${MAX_OUTPUT_BYTES} byte limit]`
  );
}

export async function runSubmission(challengeId, files) {
  const dir = challengeDir(challengeId);
  const workDir = await mkdtemp(path.join(os.tmpdir(), "heisenbug-"));

  try {
    await cp(path.join(dir, "tests"), path.join(workDir, "tests"), { recursive: true });
    await mkdir(path.join(workDir, "src"), { recursive: true });
    await writeFile(path.join(workDir, "src", "__init__.py"), "");

    for (const [relPath, contents] of Object.entries(files)) {
      const target = path.join(workDir, relPath);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, contents);
    }

    const result = await new Promise((resolve) => {
      const proc = spawn("python3", ["-m", "pytest", "tests", "-v", "--tb=short"], {
        cwd: workDir,
      });

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        proc.kill("SIGKILL");
      }, TIMEOUT_MS);

      proc.stdout.on("data", (d) => (stdout += d));
      proc.stderr.on("data", (d) => (stderr += d));
      proc.on("close", (code) => {
        clearTimeout(timer);
        if (timedOut) {
          resolve({
            passed: false,
            stdout: capOutput(stdout),
            stderr: `Submission timed out after ${TIMEOUT_MS / 1000}s and was killed.`,
          });
          return;
        }
        resolve({ passed: code === 0, stdout: capOutput(stdout), stderr: capOutput(stderr) });
      });
      proc.on("error", (err) => {
        clearTimeout(timer);
        resolve({ passed: false, stdout: "", stderr: `runner error: ${err.message}` });
      });
    });

    return result;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
