# Heisenbug

*A practice platform for IDE-based debugging assessments (Amazon OA-style).*

"LeetCode for debugging — practice the new Amazon OA format before you face it."

See [`docs/plan.md`](docs/plan.md) for the full product plan (problem statement,
roadmap, monetization, risks).

## Status

Python debugging challenges run in a Monaco editor with browser drafts. GitHub
authentication gates E2B terminals, CineMatch web previews, and isolated pytest
grading. Execution is disabled by default until the service is configured.

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

Challenge browsing and editing work without execution credentials. Interactive
terminals, web previews, and grading use isolated E2B sandboxes and require GitHub
sign-in. There is no local subprocess fallback.

See [Interactive execution setup](docs/execution.md) for the environment file,
GitHub OAuth setup, E2B template build, deployment requirements, and test commands.
CineMatch includes a runnable movie-search web preview; other Python challenges
support shell/REPL execution and isolated grading.
