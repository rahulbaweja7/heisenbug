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
        timeout: 15_000,
      });

      let stdout = "";
      let stderr = "";
      proc.stdout.on("data", (d) => (stdout += d));
      proc.stderr.on("data", (d) => (stderr += d));
      proc.on("close", (code) => resolve({ passed: code === 0, stdout, stderr }));
      proc.on("error", (err) =>
        resolve({ passed: false, stdout: "", stderr: `runner error: ${err.message}` })
      );
    });

    return result;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
