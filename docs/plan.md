# Heisenbug — Project Plan

*A practice platform for IDE-based debugging assessments (Amazon OA-style)*

---

## 1. Problem Statement

Companies like Amazon have started using a new online assessment format: instead of writing algorithms from scratch, candidates are dropped into an **IDE environment with an existing, broken codebase** and must find and fix bugs under time pressure.

There is currently **no candidate-facing platform to practice this format**:

- Existing debugging-assessment tools (CoderPad, TestGorilla, Code Assess AI, Xobin) are **B2B hiring tools** sold to companies for screening — candidates cannot practice on them.
- LeetCode, HackerRank, etc. train a different muscle: **writing code from scratch**, not reading unfamiliar code and finding what's wrong with it. LeetCode's "Debug Testcase" feature is a minor side tool, not a training format.
- The shift toward debugging-style assessments is likely to **grow** (harder to cheat with AI than on classic LeetCode problems), so demand for prep will grow with it.

**Gap:** Students and job-seekers facing these assessments have nowhere to practice the actual format before the real thing.

## 2. The Solution

A web platform where users:

1. Pick a challenge (language, difficulty, bug category).
2. Get dropped into a **browser IDE** with a small multi-file project containing planted bugs.
3. See **failing test cases** and a **countdown timer** — mirroring the real assessment.
4. Edit the code, run the hidden test suite, and pass when all tests are green.
5. Get a **post-solve explanation**: what the bug was, why it happens in real code, and how to spot that pattern faster next time.

**One-line pitch:** "LeetCode for debugging — practice the new Amazon OA format before you face it."

## 3. Target Users

- **Primary:** CS students and new grads preparing for Amazon (and similar) online assessments.
- **Secondary:** Junior developers who want to sharpen code-reading/debugging skills; bootcamp grads.
- **Where they hang out:** r/csMajors, r/leetcode, r/cscareerquestions, Discord prep servers, campus groups.

## 4. Core Features (MVP)

| Feature | Description | Priority |
|---|---|---|
| Browser IDE | Monaco editor + file tree + output panel | Must |
| Test runner | Runs hidden test suite against user's edited code | Must |
| Timer | Per-challenge countdown, mirrors exam pressure | Must |
| Challenge library | ~20–30 hand-crafted challenges (Python + Java first) | Must |
| Post-solve explanation | Bug walkthrough + pattern recognition tips | Must |
| Progress tracking | Solved/unsolved, streaks (localStorage first, auth later) | Should |
| Bug categories | Filter by off-by-one, logic error, API misuse, edge cases, etc. | Should |
| Difficulty tiers | Easy / Medium / Hard | Should |

**Explicitly OUT of MVP:** leaderboards, payments, AI hints, company-specific tracks, plagiarism detection, mobile app, multiplayer/contests.

## 5. Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────────┐
│  Frontend    │────▶│  Backend API  │────▶│  Code Execution    │
│  React +     │     │  (Node/       │     │  Judge0 (MVP) or   │
│  Monaco      │◀────│  FastAPI)     │◀────│  Docker sandboxes  │
└─────────────┘     └──────────────┘     └───────────────────┘
                          │
                    ┌─────▼──────┐
                    │ Challenge   │
                    │ store (repo │
                    │ of folders) │
                    └────────────┘
```

### 5.1 Frontend
- **React + Monaco Editor** (the editor that powers VS Code; free, battle-tested, embeds in browser).
- Components: file tree sidebar, editor tabs, test output panel, timer bar, results modal.
- State: current challenge files held in memory; submit sends edited files to backend.

### 5.2 Code Execution (the risky part — running untrusted code)
- **MVP: Judge0** (open-source code execution engine; self-host or use cloud API). Send files + tests, get pass/fail results. Fastest path to shipping.
- **Later: custom Docker sandboxes** — one container per submission with CPU/memory/time limits and no network. Needed when challenges get bigger (real test frameworks like pytest/JUnit, larger multi-file projects).
- Never execute user code on the main server process. Ever.

### 5.3 Backend
- Thin API: serve challenge metadata + starter files, accept submissions, forward to executor, return results, record progress.
- Node (Express/Fastify) or Python (FastAPI) — whichever you're faster in.
- DB: start with SQLite/Postgres for users + submissions. Challenges themselves live as files in a git repo (see below), not in the DB.

## 6. Challenge Content Format

Each challenge is a self-contained folder — this makes adding content trivial and reviewable via git:

```
challenges/
  challenge-042-inventory-race/
    meta.json          # title, language, difficulty, time limit, bug categories, tags
    starter/           # the broken project the user sees and edits
      src/...
    tests/             # hidden test suite that must pass
    solution/          # reference fix (for maintainers + explanation)
    explanation.md     # what the bug was, how to spot the pattern
```

**meta.json example:**
```json
{
  "id": "042-inventory-race",
  "title": "Inventory Count Mismatch",
  "language": "python",
  "difficulty": "medium",
  "timeLimitMinutes": 25,
  "bugCategories": ["state-mutation", "off-by-one"],
  "filesVisible": ["src/inventory.py", "src/store.py"],
  "entryTest": "tests/test_inventory.py"
}
```

### 6.1 Bug taxonomy (what to plant)
- Off-by-one errors (loops, slicing, boundaries)
- Wrong comparison/logic operators (`<` vs `<=`, `and` vs `or`)
- State mutation bugs (mutating shared lists/dicts, aliasing)
- Incorrect API/library usage (wrong method, wrong argument order)
- Edge-case failures (empty input, single element, duplicates, negatives)
- Type/conversion issues (int vs float, string vs number keys)
- Control-flow bugs (early return, missing break/continue, wrong branch)
- (Later, for Hard tier) concurrency/ordering issues, performance bugs

### 6.2 Content pipeline (the moat)
Hand-craft the first 20–30. After that, semi-automate:
1. Generate or adapt a small working project (100–300 lines, 2–5 files).
2. Inject 1–3 bugs from specific categories.
3. Write tests that fail because of the bugs (and pass on the reference solution).
4. **Human review every challenge** — auto-generated bugs are often too obvious or too broken. Quality is the product.

## 7. Plan of Action (Roadmap)

### Phase 0 — Validate (Week 0, parallel with build)
- Post the concept in r/csMajors / r/leetcode: "Would you use a platform to practice Amazon's new debugging OA format?"
- Collect emails on a one-page landing site (Carrd/Framer). Target: 100+ signups = strong signal.

### Phase 1 — Walking skeleton (Week 1)
- Monaco + file tree rendering a hardcoded challenge.
- Judge0 integration: submit → run tests → show pass/fail.
- One challenge working end to end. Ugly is fine.

### Phase 2 — Real product shape (Weeks 2–3)
- Challenge loader reading the folder schema.
- Timer, results screen, post-solve explanation view.
- Challenge list page with difficulty/category filters.
- localStorage progress tracking.
- Write 10 challenges (Python first).

### Phase 3 — Content + polish (Weeks 4–5)
- Reach 20–30 challenges across Python + Java.
- Basic auth (email or GitHub OAuth) + server-side progress.
- Landing page with clear pitch; deploy (Vercel frontend + small VPS/Fly.io backend + Judge0).

### Phase 4 — Launch (Week 6)
- Launch posts: r/csMajors, r/leetcode, Twitter/X, LinkedIn, Discord servers.
- Feedback loop: which challenges are too easy/hard, what languages people want.
- Watch metrics: signups, challenges attempted per user, completion rate, return visits.

### Phase 5 — Grow (post-launch, pick based on feedback)
- More languages (C++, JavaScript).
- Timed mock assessments (3 challenges, 90 min, one score — full exam simulation).
- AI hint system (progressive hints without spoiling).
- Premium tier (see below).

## 8. Monetization (later, not MVP)

- **Freemium:** free tier with a rotating subset of challenges; premium (~$10–15/mo, LeetCode-premium pricing) unlocks full library, mock assessments, solutions/explanations, company-format tracks.
- **Seasonal spikes:** internship/new-grad recruiting seasons (Aug–Oct, Jan–Mar) are when demand peaks — time launches and marketing pushes around them.
- Long-term optional: B2B (universities, bootcamps) — but stay candidate-first; that's the open lane.

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Running untrusted code = security risk | Judge0 / isolated Docker only; resource limits; no network in sandboxes |
| Content is slow to produce | Folder schema + semi-automated bug injection + human review |
| Amazon changes/abandons the format | Debugging skill is evergreen; position as "debugging practice," not only "Amazon prep" |
| Big player (LeetCode) copies it | Move fast, own the niche community, make content depth the moat |
| Low willingness to pay | Validate with free tier first; charge only once retention is proven |

## 10. Tech Stack Summary (recommended)

- **Frontend:** React + Vite, Monaco Editor, Tailwind
- **Backend:** Node (Fastify) or FastAPI — pick your fastest language
- **Execution:** Judge0 (MVP) → custom Docker sandboxes (scale)
- **DB:** Postgres (users, submissions); challenges as files in git
- **Hosting:** Vercel (frontend), Fly.io/small VPS (backend + Judge0)
- **Auth:** GitHub OAuth (your users all have GitHub)

## 11. Success Criteria (first 3 months)

- 500+ registered users
- 40%+ of new users attempt ≥3 challenges
- 20%+ week-2 return rate
- Qualitative: unprompted "this felt like the real OA" feedback

## 12. Open Decisions

- [ ] Name + domain
- [ ] First language: Python only, or Python + Java from day one?
- [ ] Judge0 cloud API vs self-hosted from the start
- [ ] Solo build vs finding a collaborator for content authoring
- [ ] Free-only launch vs premium waitlist from day one
