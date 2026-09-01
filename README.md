# Heisenbug

*A practice platform for IDE-based debugging assessments (Amazon OA-style).*

"LeetCode for debugging — practice the new Amazon OA format before you face it."

See [`docs/plan.md`](docs/plan.md) for the full product plan (problem statement,
roadmap, monetization, risks).

## Status

Phase 1 walking skeleton: Monaco editor + file tree renders a hardcoded
challenge, submit sends edited files to the backend, backend runs the hidden
pytest suite and returns pass/fail. One challenge (`001-off-by-one-inventory`)
works end to end.

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

Requires Node 20+ and Python 3 with `pytest` installed (`pip install pytest`)
— pytest is what actually runs the hidden test suite against submissions.

```bash
# backend (http://localhost:4001)
cd apps/backend
npm install
npm run dev

# frontend (http://localhost:5173)
cd apps/frontend
npm install
npm run dev
```

## Important: code execution is NOT sandboxed yet

`apps/backend/src/runner.js` currently runs `pytest` as a local subprocess on
whatever machine the backend is running on — no isolation, no resource
limits. This is fine for local development but **must** be swapped for
Judge0 or an isolated Docker sandbox (no network, CPU/memory/time limits)
before this is ever exposed to the public or run against untrusted
submissions. See section 5.2 of the plan.

## Next steps (Phase 2)

- Challenge list page with difficulty/category filters
- localStorage progress tracking
- Post-solve explanation view (content already exists in `explanation.md` per
  challenge, just needs a UI)
- Write ~10 more challenges (Python first)
