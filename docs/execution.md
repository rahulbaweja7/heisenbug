# Interactive execution

Heisenbug uses E2B workspaces for the interactive terminal and separate, disposable
E2B sandboxes for grading. The API never executes candidate code on its host.
GitHub sign-in is required for both actions. Challenge browsing and editor drafts
continue to work while execution is disabled.

## Local setup

Use Node **22.20 or newer** (the backend uses `node:sqlite`). Install dependencies
with `npm ci` in `apps/backend` and `apps/frontend`.

1. Copy `apps/backend/execution.env.example` to `apps/backend/.env`. Keep this file
   private. The older Judge0 `.env.example` describes a separate, unused spike.
2. Create a GitHub OAuth app. For local development, set its homepage to
   `http://localhost:5173` and callback to `http://localhost:4001/api/auth/callback`.
   Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env`. No repository scopes
   are requested; the access token is used to read identity and is not retained.
3. Set `E2B_API_KEY`, then build the template from `apps/backend`:

   ```powershell
   node --env-file=.env scripts/build-template.js
   ```

   This creates a remote template and uses the E2B account's resources. Set
   `E2B_TEMPLATE` to the template alias (`heisenbug-python` by default).
4. Set `EXECUTION_ENABLED=true`. Run `npm run dev` in `apps/backend`, and run
   `npm run dev` in another terminal in `apps/frontend`.
5. Open `http://localhost:5173`, sign in with GitHub, and start a challenge
   workspace. Use the hostname `localhost`, matching `APP_ORIGIN`, rather than
   substituting `127.0.0.1`.

To grant analytics dashboard access, set `ADMIN_GITHUB_IDS` to a comma-separated
list of stable numeric GitHub user IDs. An empty value denies access to everyone.
Authorized users can open `/admin/analytics`; the backend enforces the allowlist.

## Progress and analytics

Signed-in progress is stored in SQLite and includes completed attempt counts,
imported browser solves, and server-verified solves. Browser drafts and guest solve
marks stay in local storage. Import is always an explicit choice, keeps local marks,
and never counts as a verified completion. Submission request UUIDs make retries
idempotent without storing candidate code or test output.

Optional browser analytics defaults to off. Accepting creates a visitor identifier
that expires after 90 days and a session identifier that rotates after 30 minutes
of inactivity. Withdrawing consent deletes both identifiers and stops future view
and practice-start events. The server stores receipt times and minimal identifiers,
prunes browser events after 90 days, and does not store IP addresses, URLs,
referrers, editor contents, or terminal contents in analytics records.

Dashboard browser-funnel metrics cover consented activity. Returning visitors have
an earlier tracked session in retained history. Tracked conversion is the share of
viewed challenge/session pairs followed by a completed submission for that same
challenge and session. Pass rate is passing submissions divided by completed
submissions. All-account grading totals are shown separately, and imported solves
never contribute to verified completion metrics.

The preview gateway listens on port 4002. Each workspace gets its own
`<workspace-id>.localhost:4002` hostname. A browser that resolves `*.localhost` to
loopback is required for local preview verification.

## Workspace behavior

- Python, Bash and pytest are preinstalled; public internet access is disabled.
- Editor files live under `/workspace`. Saves debounce for 600 ms. Terminal
  input waits for pending saves, while Ctrl+C remains available to interrupt.
- The editor polls for shell-created/changed/deleted text files every 2.5 seconds.
  Concurrent edits show **Keep editor** and **Use terminal version** choices.
- Text files are limited to 100 KB each, 200 files, and 1 MB total. Hidden files,
  symlinks, binary files, caches, `node_modules`, and reserved `tests/` are not
  synchronized. Write public tests as `test_*.py` at the workspace root.
- Reopening a live workspace reconnects to the shell. Differing browser drafts
  require an explicit file-conflict choice. After expiry, a new workspace restores
  editor drafts, but processes and other temporary files reset.
- Limits default to one workspace plus one grading job per user, ten total
  sandboxes, ten minutes idle, sixty minutes per workspace, and 120 execution
  minutes per user per UTC day. Grading time counts toward that allowance.
- **Run tests** snapshots current editor files and runs server-held pytest tests in
  a fresh sandbox with a ten-second command limit and 50 KB output limit. Service
  failures are displayed separately from failing tests. Hidden tests never enter
  the interactive workspace; the grading sandbox may expose test diagnostics.
- **Stop workspace** and sign-out terminate the user's active sandboxes. A cleanup
  sweep retries failures. The provider's timeout bounds orphan lifetime if the API
  crashes; startup reconciliation closes previously recorded sessions.

## CineMatch preview

Open challenge `048-django-imdb-movie-search`, start a workspace, and click
**Preview**. Its metadata launches `exec /opt/venv/bin/python serve.py` on port 8000.
Use **Restart server** after changing Python source.

The adapter deliberately calls the exercise's existing routes and views. Starter
errors remain visible. Search, genre filters, pagination, details, and watchlist
actions exercise the same functions as grading. Guest and two demo identities are
fictional app users, separate from GitHub login. The same supporting adapter and
README are included in the reference solution.

Preview pages receive a restricted CSP and iframe permissions. Each workspace has
a distinct hostname; the gateway authenticates a short-lived bootstrap ticket,
sets a host-only HttpOnly preview cookie, and forwards traffic to private E2B
ingress. Browser cookies, authorization and proxy-control headers are not forwarded
to the candidate server. Candidate response cookies are stripped. This version
supports CineMatch's URL/form-based demo identities, rather than cookie-based
authentication inside arbitrary preview apps.

## Public deployment

Run one long-lived backend instance with a persistent volume for
`DATABASE_PATH`. Do not deploy this backend as stateless serverless functions or
run multiple replicas: live PTY connections and quota reservations are held in
memory, backed by the SQLite ledger for restart recovery.

Use same-site HTTPS origins, for example:

```dotenv
APP_ORIGIN=https://app.example.com
API_ORIGIN=https://api.example.com
PREVIEW_ORIGIN=https://preview.example.com
PREVIEW_PORT=4002
DATABASE_PATH=/data/heisenbug.sqlite
```

Set frontend `VITE_API_BASE=https://api.example.com` at build time. Configure the
GitHub callback for the API HTTPS origin. Route API HTTP/WebSocket traffic to port
4001, and wildcard `*.preview.example.com` HTTP/WebSocket traffic to port 4002.
Preserve the original Host header and provision wildcard DNS and TLS. The API
does not trust forwarded client-IP headers; apply per-client edge rate limits
before the proxy as well as the built-in conservative request limit. Same-site
origins allow host-only SameSite=Lax cookies in the embedded preview.

Keep execution disabled until the live smoke checks below pass. Configure E2B
account spending limits and alerts. Logs include sandbox startup/duration and
cleanup failures; do not log OAuth callback URLs, preview bootstrap URLs, request
cookies, or provider credentials at the reverse proxy. Back up SQLite using an
online SQLite backup or stop the process before copying the database and WAL.

Roll back execution by setting `EXECUTION_ENABLED=false` and restarting. Startup
reconciliation terminates previously recorded sandboxes; editor drafts remain in
the browser. No challenge migration or progress migration is required.

## Verification

```powershell
cd apps/backend
npm test
cd ../frontend
npm test
npm run build
npm run lint
cd ../..
python scripts/test-cinematch-preview.py
```

On Linux, also run `python3 apps/backend/test/workspace-files.test.py`. These tests
check symlink/hardlink handling and revisions using actual Linux file operations.
Backend tests use a fake provider to cover authentication, isolation, quotas,
WebSocket input/output, grading, expiry and preview-ticket handling.

With a configured E2B template, run from `apps/backend`:

```powershell
node --env-file=.env scripts/smoke-e2b.js
```

Then verify GitHub login in a browser, Python REPL input, Ctrl+C, resizing,
reconnection, terminal/editor edits and conflicts, CineMatch preview and restart,
and grading the reference solution. Check a second user's isolation, quota
responses, provider outages, and cleanup after a backend restart before enabling
public traffic. Automated fake-provider tests are not proof of a live deployment.
