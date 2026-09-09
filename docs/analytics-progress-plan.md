# Analytics and Server-Side Progress

## Summary

Add account-based solve history and a private analytics dashboard covering challenge views, practice starts, submissions, and completions. Use the existing SQLite database and GitHub authentication.

Chosen scope:

- Track returning visitors using an optional persistent browser identifier.
- Sync solve history and attempt counts across devices; editor drafts remain browser-local.
- Offer an explicit import of existing browser progress.
- Keep imported solves distinct from server-verified completions.

Status: implementation plan, saved 2026-09-09. The features below are not yet implemented.

## Persistence and grading

- Add versioned, transactional SQLite migrations for submissions, challenge progress, browser analytics events, and successful workspace starts. Preserve existing authentication and execution tables.
- Store submission ID, user ID, challenge ID, server timestamps, and outcome: pending, passed, failed, or infrastructure error. Do not store submitted code, test output, or credentials.
- Record accepted grading attempts after validation and quota reservation, before sandbox allocation. Rejected requests do not count as attempts; allocation failures count as infrastructure errors. On restart, mark unfinished attempts as interrupted infrastructure errors.
- Finalize each grading result and its progress update in one transaction. Passing creates or upgrades the account's verified solve; subsequent failures never remove it. Preserve first verified completion time.
- Keep cleanup failures separate from grading outcomes. A completed, persisted result remains valid while existing cleanup mechanisms retry sandbox termination. If result persistence fails, return an explicit service error and do not claim progress was saved.
- Add a submission request UUID to the existing submit request. Enforce uniqueness per account: retries return the recorded result summary or pending status without allocating another sandbox. Existing clients without a UUID continue working with a server-generated ID.
- Keep durable progress and submission records until explicitly deleted by a future maintenance operation. Retain browser events for 90 days, pruning through the existing scheduled sweep.

## Account progress and browser behavior

- Add authenticated `GET /api/progress`, returning challenge IDs, imported/verified solve status, first verified completion time, and completed attempt counts. Infrastructure failures do not count as completed attempts.
- Add origin-checked `POST /api/progress/import` accepting a bounded list of existing challenge IDs. Imports are idempotent, never overwrite verified progress, and never create analytics completions.
- Move identity and progress into shared frontend state consumed by the challenge list and IDE. Make sign-in available on the challenge list and preserve workspace logout cleanup.
- After login, offer **Import browser progress** and **Not now** when valid legacy marks exist. Show the destination GitHub account and eligible challenge count. Keep local marks intact; record successful import handling per account/browser.
- Display both imported and verified challenges as solved, with a distinguishable label or tooltip. A future successful submission upgrades imported progress to verified.
- Refresh progress after grading, imports, login, navigation to the challenge list, and window focus. Clear account state immediately on logout or account changes; ignore stale responses from earlier accounts.
- Keep guest browser progress working. If account progress cannot load, show an unavailable/retry state rather than presenting an empty account as having no solves. Account progress must remain available when execution is disabled.

## Analytics collection and dashboard

### Collection and identity

- Provide an analytics preference control with **Allow analytics** and **Decline**. Default optional browser tracking to off until accepted.
- On acceptance, generate a random persistent visitor ID, expiring after 90 days, plus a session ID that rotates after 30 minutes of inactivity. Declining or withdrawing clears these IDs and stops future browser events.
- Collect only allowlisted challenge-view and practice-start events through `POST /api/analytics/events`. A view occurs after challenge content loads; a practice start occurs on the first edit or execution interaction for that challenge/session.
- Use event UUIDs for retry deduplication and avoid duplicate events from React StrictMode. Accept bounded batches, validate challenge IDs and identifiers, enforce origin checks and a dedicated ingestion rate limit.
- Derive submission results and successful workspace starts on the server. Browser events cannot award solves or claim successful grading.
- When tracking is accepted, carry the session through OAuth and attach analytics identifiers to authenticated interactions. Do not retrospectively link earlier sessions to an account.
- Store server receipt times and minimal identifiers; omit IP addresses, full URLs, referrers, code, and terminal contents. Browser analytics failures never block editing or grading. Operational submission/progress records remain necessary regardless of optional tracking preference.

### Metrics and access

- Add `ADMIN_GITHUB_IDS`, an allowlist of stable numeric GitHub IDs. Empty configuration denies dashboard access. Enforce access on the backend and expose an `isAdmin` capability through the identity response.
- Add `/admin/analytics` and authenticated `GET /api/admin/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD`, using inclusive UTC calendar dates and a maximum 90-day range. Default to the last 30 days.
- Show daily trends and a per-challenge table: views, practice starts, successful workspace starts, completed submissions, passing submissions, unique verified solvers, and infrastructure errors.
- Show returning tracked visitors as visitors with an earlier tracked session within retained history. Label this as consented browser activity, not unique people.
- Calculate submission pass rate as passing submissions divided by completed submissions. Calculate tracked-session conversion from viewed challenge/session pairs that later submit or pass that challenge in the same session.
- Keep all-account grading totals separate from the consented visitor funnel. Imported solves never contribute to verified completion metrics.
- Include loading, empty, forbidden, and error states, date controls, sortable challenge rows, and responsive table layout. Do not add user-level browsing reports or active-time estimates.

## Verification and delivery

- Test migration against both empty and existing databases, including repeat startup.
- Test account isolation, duplicate submissions/imports, pass-then-fail behavior, import-to-verified upgrades, rejected requests, provider failures, cleanup failures, and interrupted grading recovery.
- Test consent defaults and withdrawal, identifier expiry, event validation and deduplication, retention, date boundaries, metric denominators, and admin authorization.
- Test frontend login/logout transitions, stale responses, import choices, failed progress requests, cross-device refresh behavior, and StrictMode event duplication.
- Run backend and frontend tests, frontend build and lint. Verify the dashboard and progress flows in a browser with a fake provider; real E2B smoke testing remains a separate deployment check.
- Update setup documentation with admin configuration, tracking behavior, retention, and metric definitions. Update `TASKS.md` and append the implementation and validation record to `AGENTS.md`.
- Deliver in three reviewable slices: persistence/grading, account progress/import, then analytics/dashboard. Follow the repository commit protocol; no deployment is included.

Acceptance: a verified solve appears on another device after login, legacy marks import only by choice, grading cannot double-count a retried request, and an authorized administrator can inspect correctly labeled usage and completion metrics.
