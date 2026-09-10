# Comprehensive testing and GitHub CI plan

Date: 2026-09-09. Status: implemented baseline; the remaining items below are
follow-up coverage and operational checks.

## Goals and baseline

Protect the complete browse → edit → execute → submit → review journey, account
progress, optional analytics, and administrator reporting. Give every pull
request reproducible checks without OAuth or E2B credentials. Verify real E2B
behavior separately before releases. Preserve the rule that the backend never
executes candidate code on its host.

Repository inspection found:

- Backend: `node:test`, with 12 tests in `execution.test.js` and four in
  `analytics-progress.test.js`. Existing coverage includes OAuth PKCE, ownership,
  quotas, cleanup, preview credentials, WebSockets, grading isolation, progress,
  migrations, and analytics. Extend these assertions rather than duplicate them.
- Frontend: `node:test` with three merge tests and two analytics tests. No
  component or browser suite; production build and oxlint scripts exist.
- Python: Linux file-bridge tests, a CineMatch adapter check, and a repository-wide
  challenge contract runner exist. The contract runner uses the constrained
  Docker image in CI; each challenge has server-held tests and a reference solution.
- Live provider: `apps/backend/scripts/smoke-e2b.js` checks the API workspace and
  grading journey, hidden-test exclusion, files, PTY, runtime permissions, and
  cleanup. It requires configured E2B credentials and a built template.
- `.github/workflows/ci.yml` runs the required suites and gated deployment; the
  trusted E2B workflow is separate. Two independent app lockfiles; no root npm
  project. Use Node 22.20+ and a Python version matching the E2B template.

This baseline is based on source inspection, not a fresh test run. Earlier audit
entries mention backend hangs; first implementation must establish a clean run
and diagnose any unresolved open servers, sockets, or timers.

## Suite design

Keep backend tests on `node:test` with Fastify injection and real temporary
SQLite databases. Extract reusable fake-provider and authenticated-user fixtures
from the existing tests. Use real local sockets for protocol-specific tests.
Stub only external boundaries, especially GitHub and E2B.

Add Vitest, React Testing Library, user-event, jsdom, and coverage support for
frontend logic/components. Migrate the five existing tests without losing cases;
keep `npm test` a non-watch command. Use Playwright for browser tests against the
production frontend build and a real backend with an injected fake provider.
Verify compatible dependency versions when implementing and commit lockfiles.

Use a dedicated test launcher outside production source to seed synthetic users,
issue test session cookies, and inject the provider through `buildApp`. Do not
add a production authentication bypass or test login endpoint. Fail if a local
suite attempts external network access, except explicitly allowed loopback
servers. Never load developer `.env` files in tests.

### Backend coverage matrix

| Area | Required cases |
| --- | --- |
| Catalog and content | List/detail schemas; unknown/malformed IDs; traversal attempts; visible files match metadata; no hidden tests or solution source in workspace responses; explanation/writeup endpoints preserve the current public contract. |
| Authentication | Successful PKCE exchange; missing/mismatched/expired/replayed state; provider errors and malformed identity; safe return URLs; cookie attributes; session expiry; logout revocation and cleanup; no retained access token. |
| Authorization | Anonymous and second-user access for every workspace, file, terminal, grading, progress, and preview operation; missing/hostile origins; disabled execution allocates no sandbox; rejected operations cause no persistence side effects. |
| Workspace files | UTF-8 byte boundaries for per-file/total limits; count limits; invalid payload shapes; traversal, absolute/Windows paths, reserved/hidden paths, null bytes, binary data, parent/file collisions; revision conflict and deletion. |
| Lifecycle and quotas | Concurrent starts at capacity; per-user/global limits; grading reservations; UTC day rollover; idle/max lifetime; startup/seed failures; repeated stop; kill failure/retry; logout during execution; durable restart reconciliation without leaked capacity. |
| Terminal | Real WebSocket authentication/origin/ownership; input/output; resize validation; oversized/malformed frames; disconnect/reconnect; expired workspace; shutdown releases sockets and PTY resources. |
| Grading | Separate sandbox; immutable submitted snapshot; trusted tests staged only for grading; pass/fail/timeout/output limit/infrastructure error; correct exit-code handling; cleanup on every outcome. |
| Idempotency | Same UUID and payload, including simultaneous requests, produces one attempt; mismatched reuse rejected; UUID ownership isolation; retry after completion; interrupted pending attempt recovery; infrastructure failures excluded from completed attempts. |
| Persistence/progress | Fresh and repeat migrations; file-backed close/reopen; transaction rollback; import validation/deduplication; user isolation; imported solve upgrades to verified; verified state cannot be downgraded; totals and attempt timestamps remain consistent. |
| Analytics/admin | Default-off and rejected consent; event schema/size limits; duplicate events; receipt timestamps; retention cutoff boundaries; allowlist denies by default; account and consented metrics stay separate; imported solves excluded; deterministic funnel/returning-visitor/date-range fixtures; no code or private request data stored. |
| Preview gateway | Ticket expiry/replay/host scope; logout revocation; host spoofing; cookie attributes; request credential stripping and response Set-Cookie stripping; CSP/iframe restrictions; HTTP and supported WebSocket paths; unavailable upstream and restart. |
| HTTP robustness | Body/rate limits and Retry-After; CORS preflight; sanitized error responses; forwarded-IP spoofing does not bypass limiter; malformed requests do not allocate resources. |

Use controlled clocks and deferred provider promises for races and expiry; avoid
real multi-minute waits. Table-drive authorization and boundary cases. File-backed
SQLite restart tests must use separate temporary directories, never the app DB.
Linux bridge tests must exercise actual symlinks/hardlinks and filesystem races
where practical; a skipped Linux suite cannot satisfy its CI job.

### Frontend component and browser coverage

Component tests assert behavior through accessible names and user actions:

- Catalog loading/error/empty states, search/filter combinations, and navigation.
- Shared identity loading, sign-in/out, expired session, and stale requests after
  switching accounts; progress must not leak between users.
- Draft restore/reset, file selection/create/delete, save debounce, save failures,
  terminal merge conflicts, and both explicit conflict-resolution choices.
- Workspace starting/active/stopping/expired/unavailable states; terminal input
  waits for saves while Ctrl+C remains usable.
- Submit in flight, UUID reuse on retry, pass/fail/timeout/infrastructure messages,
  progress refresh, explanation display, and prevention of accidental duplicates.
- Progress import accept/decline and repeated prompts; analytics consent default,
  accept/withdraw, blocked storage, expiry, and no pre-consent requests.
- Admin access denial, loading/error/empty/data states, metric labels, and keyboard
  operation; responsive layouts and focused accessibility checks.

Required Chromium browser journeys:

1. Guest browses, filters, opens a challenge, edits, reloads, and retains a draft;
   execution presents the sign-in requirement.
2. Synthetic signed-in user starts a workspace, edits real Monaco content, saves,
   uses the terminal, runs failing then passing tests, and sees persisted progress
   after reload. Assert the fake provider received the edited snapshot.
3. Simulated terminal changes conflict with unsaved editor changes; each resolution
   preserves the chosen content. Cover expiry/reconnect and offline save recovery.
4. Submission retry reuses its request ID and records exactly one completed attempt.
5. Separate browser contexts cannot access each other's workspace/progress/preview.
6. Import and consent choices persist; withdrawal stops event requests; admin and
   non-admin routes behave correctly.
7. CineMatch preview loads through the gateway and restarts; browser isolation
   prevents candidate content from reading the parent application's storage.

Use the actual Monaco, terminal, routing, and iframe in E2E; lightweight component
adapters may replace them in jsdom. Add stable accessible selectors where needed.
Configure local wildcard preview host resolution explicitly. Use bounded readiness
checks and Playwright assertions instead of fixed sleeps. Run representative
mobile viewport and Firefox/WebKit smoke journeys on the scheduled suite.

### Challenge integrity

Add `scripts/test-challenges.py` to discover every challenge automatically:

- Validate metadata, unique IDs, directory mapping, required files, supported
  language, entry test, limits, and safe visible/preview paths.
- Assemble starter and solution separately with their server-held tests in fresh
  isolated directories. Run with the same test entry semantics as grading.
- Require every reference solution to pass and each starter to fail at least one
  intended behavior assertion. Reject collection/import/setup errors, missing
  dependencies, no-tests-collected, crashes, and timeouts as proof of a valid bug.
- Produce a per-challenge report with collected/pass/fail counts and failure type;
  explicitly document exceptions if an exercise intentionally teaches syntax or
  import failures. Never blanket-ignore starter nonzero exit codes.
- Run all challenges initially and on PRs; optimize only after measuring cost.
  Run CineMatch adapter tests independently so they cannot mask grading failures.

Execute challenge code in disposable CI containers with no secrets, no network,
non-root users, resource/time limits, dropped capabilities, a read-only root and
bounded writable scratch. The CI harness may launch containers; the application
backend must still delegate execution to E2B. Never mount the Docker socket into
challenge containers. Trusted-default-branch E2B runs check runtime parity.

## GitHub Actions design

Implement `.github/workflows/ci.yml` for every `pull_request`, pushes to the
repository's actual default branch, and manual dispatch. Avoid top-level path
filters that leave required checks pending. Use Ubuntu 24.04, read-only
`contents` permissions, per-ref concurrency with cancellation of superseded
runs, job timeouts, and independent jobs:

| Job/check | Work and timeout |
| --- | --- |
| `backend-tests` | Backend `npm ci`, unit/integration/security tests and coverage; 10 minutes. |
| `frontend-checks` | Frontend `npm ci`, tests/coverage, `npm run lint`, `npm run build`; 10 minutes. |
| `python-contracts` | Linux file bridge, isolated CineMatch checks, and all challenge contracts in the non-root, no-network Docker runner; 15 minutes. |
| `browser-tests` | Install both apps, build frontend, install Chromium with OS dependencies, start test harness, run Playwright; 15 minutes. |
| `ci-required` | Always-run aggregate depending on all four jobs; fails if any required job fails, is cancelled, or is unexpectedly skipped. |

Use per-app working directories and lockfile-keyed npm download caches; never
cache `node_modules`. Pin reviewed actions to immutable commit SHAs, with a
version comment and an automated dependency-update policy. The commands are
`npm run test:coverage` in each app and `npm run test:e2e` in the frontend.
Python checks run from the repository root. Validate workflow YAML with
actionlint.

Upload coverage and challenge summaries, plus browser traces/screenshots on
failure, with seven-day retention. Do not upload databases, cookies, tokens,
developer environment files, or live-provider terminal traces. Local synthetic
test artifacts must also be checked for accidental secrets.

PR jobs receive no OAuth/E2B credentials and must work for forks. Do not use
`pull_request_target` to execute PR code. This follows GitHub's
[secure workflow guidance](https://docs.github.com/en/actions/reference/security/secure-use).
Browser installation and failure artifacts follow the
[Playwright CI guidance](https://playwright.dev/docs/ci).

Add `.github/workflows/e2b-smoke.yml` separately:

- Nightly and manual runs on the trusted default branch only; reject arbitrary
  dispatch refs before any secret-bearing job. Use an environment restricted to
  that branch and scoped E2B credentials, never production user data.
- Start with the existing provider smoke; extend it to real API workspace versus
  grading isolation, test-directory exclusion, preview ingress, timeout/output
  handling, denied outbound internet, and cleanup after induced failure/restart.
- Bound sandbox concurrency, runtime, and account spending. Use cleanup in
  `finally` plus an always-run cleanup step with tracked sandbox IDs; rely on
  provider TTL as the cancellation/crash backstop.
- Missing configuration must produce a visible failed/not-configured result,
  never a green successful test. Provider outages are reported separately from
  assertion failures and still prevent declaring live validation successful.
- Do not require paid live checks on every PR. Require a successful run for the
  release commit and current template before enabling public execution. Keep a
  real GitHub OAuth login/logout and deployed DNS/TLS preview check in the
  release checklist; mocked OAuth does not establish deployment correctness.

Add scheduled compatibility coverage for Windows Node tests/build and additional
browsers; Linux remains mandatory for filesystem security. Configure a GitHub
ruleset requiring `ci-required` after its first successful run. Repository settings
are a separate implementation step; adding YAML alone does not enforce merging.

## Reliability and acceptance

Start with coverage reporting and a recorded baseline. Before declaring the
expanded suite complete, target 85% statements/lines and 80% branches for backend
and frontend application source, with 90% branches for auth, file validation,
progress/idempotency, analytics consent, and merge logic. Include unimported
source; exclude generated files and challenge starter code, not difficult
application modules. Document justified exceptions. Coverage supplements the
explicit security/journey matrix, not replaces it.

Allow at most one browser retry for diagnostics and fail on flaky retry-only
passes. Do not retry deterministic assertion failures or quarantine authorization,
isolation, idempotency, or privacy tests. Every temporary quarantine needs an
owner, issue, and expiry. Close apps, databases, sockets, timers, and temporary
files in teardown; add per-test deadlines. Investigate hangs rather than raising
timeouts indefinitely. Target PR feedback within ten minutes of runner start;
measure before sharding or narrowing checks.

## Implementation sequence

1. **Baseline and immediate CI:** reproduce existing tests/build/lint on clean
   installs, fix harness hangs, add secret-free backend/frontend and Linux checks,
   actionlint validation, aggregate check, and local commands in `docs/testing.md`.
2. **Backend protection:** reusable fixtures, authorization/boundary matrices,
   persistence restart and concurrency tests, coverage reports and thresholds.
3. **Challenge contracts:** isolated runner, all starter/solution checks, actionable
   failure reporting, and parity fixtures. Add to the required aggregate.
4. **Frontend behavior:** migrate utility tests, component coverage, production-build
   Playwright harness and all critical Chromium journeys. Require browser check.
5. **Live and compatibility:** trusted E2B workflow, failure cleanup, additional OS/
   browser runs, release checklist, and repository ruleset configuration.

Each phase should be a focused reviewable change with passing checks; preserve
unrelated work and append the required AGENTS.md audit entry. The final handoff
must list implemented matrix cases, remaining gaps, exact commands and results,
CI run evidence (including a deliberate failing-test check that is then reverted),
coverage summaries, and required repository secrets/settings. Completion requires
a fork-safe PR run, all required checks enforced, every reference solution passing,
every starter failing for its intended reason, and successful live validation or
an explicitly documented external configuration blocker.
