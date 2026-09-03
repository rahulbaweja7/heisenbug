# Heisenbug — Shared Task List

Shared by Rahul & Kashyap. Update this file directly and commit/push your changes.

**How to use it:**
1. Pick a task from **Backlog** below.
2. Move it to **In Progress** with your name and today's date.
3. When done, move it to **Done** with a one-line note (and link a PR if there is one).
4. Adding a new task? Drop it in **Backlog** with a short description — doesn't need to be fancy.

---

## In Progress

*(move a task here when you start it — add your name)*

- [ ] Kashyap — Judge0 cloud API spike, test against multi-file pytest format (started 2026-09-01)

---

## Backlog — pick a task

### Content
- [ ] More multi-layer mini-app challenges beyond the current 10 hard ones

### Sandboxing / infra
- [ ] Decide Judge0 vs. custom Docker sandbox based on spike results
- [ ] Or: try local Judge0 again once there's real disk headroom (15GB+ free)

### Product features
- [ ] Timed mock assessment mode — bundle 3 challenges, 90 min, single score
- [ ] Auth (GitHub OAuth) + migrate progress off localStorage
- [ ] Difficulty calibration from real usage data (once there are users)
- [ ] Second language support (Java is the next most common OA language)

### Deploy
- [ ] Pick hosting: frontend (Vercel) + backend (Fly.io or small VPS)
- [ ] Rate limiting on the submit endpoint
- [ ] Domain name

### Polish / bugs
- [ ] Audit mobile responsiveness across all three pages (landing, /challenges, IDE)
- [ ] Add basic analytics (attempts/completions per challenge)

---

## Done

- [x] Rahul — tier restructure to 10 easy (1 file) / 10 medium (2-3 files) / 10 hard (4-5 files): added 2 new easy, 10 new 2-file medium, 9 new 5-file hard challenges (039–047) alongside challenge-021, each verified broken->red / solution->green — 47 challenges total in the repo now (old single-file mediums kept as bonus content)
- [x] Rahul — mobile/accessibility audit (touch targets, overflow-wrap safety) — PR #9
- [x] Rahul — challenges 022–026 (edge-case, off-by-one loop-step, wrong-API, mutable-default class, control-flow) — 26 challenges total now
- [x] Rahul — fixed a real horizontal-scroll bug in the IDE (file tabs overflow) — PR #8
- [x] Rahul — challenge 021, first multi-layer mini-app challenge (refund review system, 5 files across 4 layers, 3 bugs) — closer to the real Amazon repo-round format, based on a real OA example
- [x] Rahul — Solutions tab (LeetCode-style editorial write-ups for all 20 challenges) — PR #6
- [x] Rahul — challenges 016–020 (break/continue, sort direction, mutation, truthy-string, off-by-one) — PR #5
- [x] Phase 1 walking skeleton (Monaco IDE, Fastify backend, real pytest execution)
- [x] 15 challenges written and verified, all 8 bug categories covered
- [x] Landing page, /challenges list, LeetCode-style IDE split view
- [x] File-explorer sidebar in the IDE
- [x] Post-solve explanations, reset button, localStorage progress
- [x] Runner hardening: real timeout + output cap
