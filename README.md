# Heisenbug

*A practice platform for IDE-based debugging assessments (Amazon OA-style).*

"LeetCode for debugging — practice the new Amazon OA format before you face it."

See [`docs/plan.md`](docs/plan.md) for the full product plan (problem statement,
roadmap, monetization, risks).

## Status

48 Python debugging challenges (10 easy, 26 medium, 12 hard) run in a Monaco
editor with browser drafts. All but one (challenge-048, "CineMatch," a runnable
Django app used to exercise the live web-preview feature) follow the same
folder layout described below. No other languages are supported yet.

GitHub authentication gates E2B terminals and CineMatch's web preview.
Execution is disabled by default until that service is configured — grading
still works out of the box via a local, unsandboxed `pytest` run (see below).

## Structure

```
apps/
  frontend/     React + Vite + Monaco Editor
  backend/      Fastify API — serves challenges, runs submissions
challenges/     Each challenge is a self-contained folder (see below)
```

Each challenge folder:

```
challenges/challenge-XXX-slug/
  meta.json       # title, language, difficulty, time limit, bug categories
  starter/        # the broken project the user sees and edits
  tests/          # hidden test suite that must pass
  solution/       # reference fix
  explanation.md  # what the bug was, how to spot the pattern
```

## Running locally

Requires Node 22.20+. Install dependencies and run `npm run dev` separately in
`apps/backend` and `apps/frontend`. Browse at `http://localhost:5173`.

Everything works out of the box with zero configuration: browsing, editing, and
grading (Run Tests) all run locally with no GitHub sign-in or E2B account
needed — grading falls back to a local, unsandboxed `pytest` subprocess when
`EXECUTION_ENABLED` isn't set. Interactive terminals, live web previews (like
CineMatch), and isolated E2B-sandboxed grading are an opt-in upgrade on top of
that, gated behind GitHub sign-in once configured.

See [Interactive execution setup](docs/execution.md) for the environment file,
GitHub OAuth setup, E2B template build, deployment requirements, and test commands.
