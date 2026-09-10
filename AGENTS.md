# AGENTS.md — Heisenbug contributor and AI-agent guide

This file is the repository-level source of truth for agents working in
Heisenbug. Read it before making changes, and keep it current after completing
work.

## Project context

Heisenbug is a practice platform for IDE-based debugging assessments (the
"LeetCode for debugging" experience). Users select a challenge, edit a small
intentionally broken project in a browser-based Monaco IDE, run tests in an
isolated environment, and read an explanation after solving it.

The repository is organized as two independent Node projects:

```text
apps/backend/       Fastify ES-module API, auth, workspaces, grading, previews
apps/frontend/      React + TypeScript + Vite + Monaco browser application
challenges/         Self-contained debugging exercises
docs/               Product and execution/deployment documentation
judge0/             Older Judge0 spike/configuration retained for reference
scripts/             Setup, diagnostic, and verification scripts
```

The current execution architecture uses authenticated E2B sandboxes: one live
workspace for the interactive terminal/editor and a separate disposable
sandbox for grading. The backend must never execute candidate code on its own
host. Judge0 files and scripts are legacy spike material, not the active
runner. See [docs/execution.md](docs/execution.md) for the authoritative
execution, deployment, and security details.

Each challenge normally contains:

```text
challenges/challenge-XXX-slug/
  meta.json          metadata, limits, visible files, and preview settings
  starter/           intentionally broken files shown to candidates
  tests/             server-held tests used for grading
  solution/          maintainer reference implementation
  explanation.md     bug explanation and debugging guidance
```

Preserve the challenge contract. Starter code is supposed to fail until fixed;
the reference solution should pass the tests. Do not expose or synchronize the
reserved `tests/` directory into an interactive candidate workspace.

## Development conventions

- Use Node 22.20+; the backend uses `node:sqlite`.
- Install and run each app from its own directory. There is no root `package.json`.
- Backend source is native ES modules and uses Fastify. Frontend source is
  TypeScript/React and uses Vite.
- Keep the backend thin and preserve ownership checks, workspace/file limits,
  quotas, origin validation, preview isolation, and cleanup behavior.
- Treat all candidate code and submitted files as untrusted. Keep credentials,
  OAuth secrets, E2B keys, `.env` files, databases, build output, dependency
  directories, and caches out of commits.
- Prefer small, focused changes. Follow the existing style in nearby files and
  update documentation when behavior or operational requirements change.
- Preserve unrelated working-tree changes. Inspect `git status` before editing
  and never overwrite, reset, amend, or discard another contributor's work.

## Common commands

From the repository root, install dependencies once per app:

```powershell
cd apps/backend
npm ci
npm test

cd ../frontend
npm ci
npm test
npm run build
npm run lint
```

For execution work, copy `apps/backend/execution.env.example` to a private
`apps/backend/.env`, configure GitHub OAuth and E2B, and use the commands in
`docs/execution.md`. The live E2B smoke test is:

```powershell
cd apps/backend
node --env-file=.env scripts/smoke-e2b.js
```

The CineMatch preview check is run from the repository root with
`python scripts/test-cinematch-preview.py`. Linux-only workspace file coverage
can be run with `python3 apps/backend/test/workspace-files.test.py`.

## Commit protocol

Agents must follow this workflow for every requested change:

1. Check `git status --short` and inspect the relevant diff before editing.
2. Make the smallest complete change and update tests/docs when appropriate.
3. Run the narrowest relevant checks, then broader checks when the change
   affects shared behavior. Record failures caused by missing services or
   credentials rather than hiding them.
4. Update the change log in this file before handing off. Add a dated entry
   describing what changed, why, and the validation performed. Keep entries
   concise and append them; do not rewrite history.
5. If a commit was requested, stage only files belonging to the task, review
   `git diff --cached`, and create one focused Conventional Commit using
   `<type>(<scope>): <imperative summary>` (for example,
   `fix(execution): reject reserved workspace paths`). Include a body when the
   reason or verification is not obvious. Never include secrets or generated
   artifacts.
6. Do not push, force-push, rebase shared branches, amend commits, or use
   destructive Git commands unless the user explicitly requests that exact
   operation. The `scripts/auto-commit.sh` helper commits snapshots but does
   not push; use it only when explicitly asked.

A commit is not required merely because an agent changed files. If no commit was
requested, leave changes in the working tree and report the files and checks.

## Required agent change-log update

Every agent that completes a material task must append one entry here before
finishing, including changes to code, tests, infrastructure, or documentation.
Use this format:

`- YYYY-MM-DD — Agent: <short summary>. Validation: <checks, or why not run>.`

If a task is continued by another agent, that agent adds its own entry rather
than editing a previous entry. Keep this section as a concise audit trail; do
not record secrets, tokens, personal data, or full command output.

### Change log

- 2026-09-09 — Agent: Fixed the Playwright user-isolation request by giving the
  guest context the configured frontend origin before calling the API.
  Validation: four of five GitHub browser journeys passed before the fix; local
  Playwright discovery and TypeScript production build passed afterward.
- 2026-09-09 — Agent: Corrected the Playwright web-server launcher's Git
  executable mode so browser CI can start it. Validation: shell syntax and
  Playwright test discovery passed.
- 2026-09-09 — Agent: Added challenge contracts, frontend component and browser
  tests, fork-safe CI, trusted E2B smoke checks, VM/Coolify packaging, and gated
  GHCR deployment with revision verification. Validation: backend 17/17,
  frontend 8/8, all 48 challenge contracts, Linux bridge 4/4, CineMatch 5/5,
  frontend build/lint/coverage, shell/Python/YAML checks passed; local Playwright
  execution was blocked by missing system browser libraries and unavailable sudo.

- 2026-09-09 — Agent: Reviewed and completed account progress, idempotent grading,
  consented analytics, administrator reporting, UI flows, tests, and operational
  documentation from the analytics progress plan. Validation: backend 16/16 and
  frontend 2/2 tests passed; frontend TypeScript build, Vite production build,
  and oxlint passed (warnings only).
- 2026-09-09 — Agent: Added shared frontend identity/progress state, browser
  progress import prompt, optional analytics identifiers/events, UUID submits,
  and the responsive admin analytics view. Validation: TypeScript build passed;
  Vite build/lint were blocked by the existing missing native rolldown binding.

- 2026-09-09 — Agent: Added repository guidance, current architecture context,
  commit protocol, and the required agent change-log process. Validation:
  reviewed repository docs, package scripts, execution configuration, and Git
  history; no application tests run because this change only adds project
  guidance.
- 2026-09-09 — Agent: Saved the agreed analytics and server-side progress
  implementation plan in `docs/analytics-progress-plan.md` for implementation
  handoff. Validation: checked the saved Markdown and required plan sections;
  application tests not run for this documentation-only change.
- 2026-09-09 — Agent: Added initial versioned persistence tables, admin ID
  configuration, and authenticated progress/import endpoints. Validation:
  `git diff --check` passed; backend test suite timed out in the existing
  execution test after 58 seconds.
- 2026-09-09 — Agent: Completed backend persistence, idempotent grading,
  workspace-start recording, consent analytics ingestion, retention, and admin
  metrics endpoints. Validation: syntax checks passed; backend test process
  reached TAP startup but did not complete within the available timeout.
