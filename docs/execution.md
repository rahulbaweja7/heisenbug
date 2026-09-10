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
viewed challenge/session pairs followed by an accepted submission for that same
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

### VM setup with Coolify and automatic deployment

This is the implementation guide for a single Linux VM running Coolify. The
intended flow is **merge to the default branch → CI passes → publish a versioned
backend image → Coolify replaces the running backend → verify health**. Ordinary
updates then need no manual Git pull or dependency installation on the VM.

The repository includes `apps/backend/Dockerfile`, `.dockerignore`, and
`scripts/deploy-backend.sh`. The CI workflow builds and smoke-tests the image on
every change, then publishes the exact default-branch SHA and deploys it through
Coolify after all required checks pass. Repository and Coolify configuration are
still required before the first deployment.
Use [the testing plan](testing-plan.md) for the required CI jobs. Replace
`example.com`, `OWNER`, `REPOSITORY`, and application UUIDs with your own values.
The shell examples in this section run on Linux or GitHub's Ubuntu runner.

#### 1. Prepare the VM and DNS

Use a fresh Ubuntu 24.04 LTS VM with SSH access. A practical starting allocation
is 2 vCPU, 4 GB RAM, and 40 GB SSD; measure actual use and resize as needed. Build
images on GitHub runners to avoid competing with the live API for VM memory.
Candidate Python processes still run in E2B, not on this VM.

Create DNS records:

| Name | Destination |
| --- | --- |
| `coolify.example.com` | VM public IP |
| `api.example.com` | VM public IP |
| `preview.example.com` | VM public IP |
| `*.preview.example.com` | VM public IP |
| `app.example.com` | Your frontend host, which may be a separate static host |

Allow inbound HTTP/HTTPS on 80/443 and restrict SSH to your administration access.
Do not expose backend ports 4001/4002 directly. Follow Coolify's
[firewall instructions](https://coolify.io/docs/knowledge-base/server/firewall)
for temporary dashboard access; Docker port publishing can bypass simple UFW
rules, so also configure the VM provider's firewall.

Install Coolify using the [official installer](https://coolify.io/docs/get-started/installation):

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh -o /tmp/coolify-install.sh
less /tmp/coolify-install.sh
sudo bash /tmp/coolify-install.sh
```

Immediately create the first administrator account at the URL printed by the
installer. Configure `https://coolify.example.com`, verify HTTPS access, then
close temporary public dashboard ports as described in the firewall guide.
Create a Heisenbug project and production environment on the local server.

#### 2. Package the backend and challenges

The checked-in `apps/backend/Dockerfile` uses the following configuration. Its
maintained Node 22 base image is pinned to a reviewed digest and must remain
22.20+.
This is different from `apps/backend/sandbox/Dockerfile`, which builds the E2B
Python runtime and must not be used as the API image.

```dockerfile
FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app/apps/backend
COPY apps/backend/package.json apps/backend/package-lock.json ./
RUN npm ci --omit=dev
COPY apps/backend/src ./src
COPY apps/backend/scripts ./scripts
COPY apps/backend/sandbox ./sandbox
COPY challenges /app/challenges
RUN mkdir -p /data && chown node:node /data
USER node
ENV PORT=4001 PREVIEW_PORT=4002 DATABASE_PATH=/data/heisenbug.sqlite
EXPOSE 4001 4002
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4001/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
```

The build context must be the **repository root**, preserving the path from
`src/challenges.js` to `/app/challenges`. Do not copy only the backend folder.
Add a root `.dockerignore`, merging with any existing file:

```text
.git
**/node_modules
**/.env
**/.env.*
**/data
**/*.sqlite*
**/*.db*
**/dist
**/coverage
**/__pycache__
**/.pytest_cache
judge0
```

Keep challenge `tests/` and `solution/` in this private backend image; the runtime
decides which files candidates receive. Never publish that image as a frontend
asset. Smoke-test the image with execution disabled before uploading it:

```bash
docker build -f apps/backend/Dockerfile -t heisenbug-backend:local .
docker run --rm --name hb-check -p 127.0.0.1:4001:4001 \
  -e EXECUTION_ENABLED=false heisenbug-backend:local
# In another terminal:
curl --fail http://127.0.0.1:4001/api/health
curl --fail http://127.0.0.1:4001/api/challenges
docker stop hb-check
```

#### 3. Create the Coolify application and persistent storage

Publish the initial tested image to a **private** GHCR package, named
`ghcr.io/OWNER/REPOSITORY-backend`, with a full commit SHA tag. GHCR names must be
lowercase. Create a Docker Image application in Coolify using that image and tag.
For a private package, configure registry authentication on the deployment server
with a credential limited to reading the package; do not use the CI publishing
credential. See [Coolify's image deployment instructions](https://coolify.io/docs/applications/ci-cd/github/actions).

Configure these application settings:

- Exposed container ports: `4001,4002`; no public host port mappings.
- One instance only. Deployment must stop the old instance completely before
  starting its replacement; do not enable overlapping rolling deployments.
- A persistent volume mounted at `/data`. Mount the directory, not just the
  SQLite file, because SQLite also creates WAL/SHM files.
- Ensure `/data` is writable by the image's `node` user (UID/GID 1000). With a
  host bind mount, create that dedicated directory and assign ownership before
  starting the app. Never make the database world-writable.
- Health check: HTTP `GET /api/health`, internal port 4001, expected status 200.
  Use a 30-second startup grace period and a bounded deployment timeout.
- Disable Git-based Auto Deploy and PR Preview Deployments for production.
  The CI deployment job will be the sole automatic deployment trigger.

Coolify supports [persistent volumes and bind mounts](https://coolify.io/docs/knowledge-base/persistent-storage).
Do not delete the volume when replacing the container or recreating the resource.

#### 4. Set runtime configuration and GitHub OAuth

In the Coolify application's runtime environment variables, set:

```dotenv
NODE_ENV=production
PORT=4001
EXECUTION_ENABLED=false
APP_ORIGIN=https://app.example.com
API_ORIGIN=https://api.example.com
PREVIEW_ORIGIN=https://preview.example.com
PREVIEW_PORT=4002
DATABASE_PATH=/data/heisenbug.sqlite
E2B_TEMPLATE=heisenbug-python
MAX_SANDBOXES=10
WORKSPACE_IDLE_MINUTES=10
WORKSPACE_MAX_MINUTES=60
WORKSPACE_DAILY_MINUTES=120
```

Add `E2B_API_KEY`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET` as private runtime
values. Set `ADMIN_GITHUB_IDS` to the intended numeric IDs, or leave it empty to
deny administrator access. Never pass these values as Docker build arguments or
frontend variables. The application requires no invented session-signing secret.

Create a production GitHub OAuth app with homepage
`https://app.example.com` and callback
`https://api.example.com/api/auth/callback`. This user-login app is separate from
any GitHub integration used by Coolify to deploy code.

Build the E2B template once from a trusted local checkout using the Local setup
steps above. Rebuild it when `apps/backend/sandbox/Dockerfile` changes, not on every
API edit. Record the template version with releases and rerun the live smoke
check when updating it.

Build the frontend with `VITE_API_BASE=https://api.example.com`, publish its
`apps/frontend/dist` directory to your frontend host, and enable SPA fallback to
`index.html` for client routes. Use the `app.example.com` custom domain even if
that host also supplies its own domain; the configured origins must agree.

#### 5. Route API and wildcard previews over HTTPS

The two ports belong to **the same backend container**. The preview host must
reach port 4002; sending it to port 4001 will not work.

For Coolify with Traefik v3, leave the application's generated Domain field empty
and add explicit custom labels for both routes. Replace domain names and ensure
the `https` entry point and `letsencrypt` resolver match your proxy configuration:

```text
traefik.enable=true
traefik.http.routers.hb-api.rule=Host(`api.example.com`)
traefik.http.routers.hb-api.entrypoints=https
traefik.http.routers.hb-api.tls=true
traefik.http.routers.hb-api.tls.certresolver=letsencrypt
traefik.http.routers.hb-api.service=hb-api
traefik.http.services.hb-api.loadbalancer.server.port=4001
traefik.http.services.hb-api.loadbalancer.passhostheader=true
traefik.http.routers.hb-preview.rule=HostRegexp(`^[a-zA-Z0-9-]+\.preview\.example\.com$`)
traefik.http.routers.hb-preview.entrypoints=https
traefik.http.routers.hb-preview.tls=true
traefik.http.routers.hb-preview.tls.certresolver=letsencrypt
traefik.http.routers.hb-preview.tls.domains[0].main=preview.example.com
traefik.http.routers.hb-preview.tls.domains[0].sans=*.preview.example.com
traefik.http.routers.hb-preview.service=hb-preview
traefik.http.services.hb-preview.loadbalancer.server.port=4002
traefik.http.services.hb-preview.loadbalancer.passhostheader=true
```

Configure the proxy's HTTP-to-HTTPS redirect. Keep Coolify's managed network
connection so Traefik can reach both exposed ports. Do not add middleware that
replaces Host, logs sensitive URLs, or interferes with WebSocket upgrades.

Set up the resolver's **DNS challenge**, with a DNS-provider API token restricted
to the relevant zone, and request a certificate covering
`*.preview.example.com`. A certificate for `*.example.com` does not cover
workspace subdomains below `preview.example.com`. DNS credentials belong only
to the proxy. Follow the provider-specific steps in Coolify's
[wildcard certificate guide](https://coolify.io/docs/knowledge-base/proxy/traefik/wildcard-certs).
The labels above use its Traefik v3 syntax; adapt them if you chose another proxy.

#### 6. Wire GitHub CI to deployment

Keep tests and deployment in the same workflow dependency graph. After the jobs
in [the testing plan](testing-plan.md), add publish and deploy jobs. Use your actual
default branch; do not assume that the current feature branch is production.

**Monorepo change detection:** add a `changes` job to the always-triggered CI
workflow. Only publish/redeploy the backend when the following inputs changed:

```text
apps/backend/**
challenges/**
.dockerignore
.github/workflows/**
scripts/deploy-backend.*
```

The backend path includes its package lockfile and Dockerfile. Challenges are
backend deployment inputs because they are copied into the image. Extend this
list whenever you add a shared runtime module or another file copied by the
Dockerfile. Changes only under `apps/frontend/**` or ordinary documentation do
not require a backend redeployment. Test-only backend changes may conservatively
redeploy at first; narrow that filter later if useful.

For test selection, compare a PR against its base using a merge-base diff, or a
push against the event's `before` SHA. Use a reviewed, SHA-pinned change-detection
action or a script using `git diff --name-only --no-renames` with full history;
include deleted paths and both sides of renames. If the base cannot be resolved,
run the affected checks conservatively. Backend tests also need to run when their
test harness or CI configuration changes; cross-app browser tests run when either
app or challenges change.

For **deployment**, compare the target commit with the **last successfully
deployed backend SHA**, recorded after health and digest verification. Do not
compare only the most recent push: a failed backend deployment followed by a
frontend-only push must still retry the outstanding backend update. Missing or
unreadable deployment history means deploy conservatively. A successful record
can use GitHub Deployments or a dedicated release record; do not advance it when
merely changing the configured Coolify image tag.

Expose a `backend_deploy` string output from the deployment change check, and
gate publishing with this job-level condition (adapt job IDs to the workflow):

```yaml
needs: [changes, ci-required]
if: >-
  github.event_name == 'push' &&
  github.ref_name == github.event.repository.default_branch &&
  needs.changes.outputs.backend_deploy == 'true' &&
  needs.ci-required.result == 'success'
```

If tests are also selected by path, the always-run `ci-required` aggregate must
accept a skip only when the successful `changes` job explicitly marked that
suite unnecessary. Failed change detection, unexpected skips, cancellations,
or failures must fail the aggregate. Keep deployment outside this PR merge gate.
Avoid top-level `paths` filters on the required CI workflow: GitHub documents
that [skipped required workflows remain pending](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).
This lets frontend-only PRs complete their checks without deploying the backend.

1. PRs run checks with read-only permissions and no deployment credentials.
2. On a default-branch push with backend changes, publish only after
   `ci-required` succeeds. Checkout
   that run's `github.sha`, build the root-context `apps/backend/Dockerfile`, and push
   `ghcr.io/OWNER/REPOSITORY-backend:<full-sha>`. Use `GITHUB_TOKEN` with
   `packages: write` only in the publishing job. Match the image architecture to
   the VM. Record the image digest; do not overwrite existing SHA tags on reruns.
3. The deploy job depends on publish and CI and uses a GitHub `production`
   environment restricted to the default branch. Give only that job the Coolify
   credentials. No manual approval is needed for routine deployment once setup
   is validated; environment branch restrictions should still apply.
4. Serialize the entire update/stop/deploy/verify sequence with a fixed concurrency
   group such as `heisenbug-production`, using `cancel-in-progress: false`.
   Also skip a run if a newer default-branch commit superseded it before deployment.
5. Enable Coolify API access and create a dedicated token permitted to read/update
   the application and stop/deploy it. A deploy-only token is insufficient for
   the image-tag update. Restrict its team/resource access where supported.

Store `COOLIFY_TOKEN` as a GitHub production-environment secret. Store
`COOLIFY_URL` (e.g. `https://coolify.example.com`) and `COOLIFY_APP_UUID` as
environment variables. The publish job returns `IMAGE_TAG` as the full tested
commit SHA. Do not give this job OAuth, E2B, or database credentials.

Implement the deployment script around these API calls. Pass values through the
step's `env` mapping, never by interpolating secrets into shell source:

```bash
set -euo pipefail
: "${COOLIFY_URL:?}" "${COOLIFY_APP_UUID:?}" "${COOLIFY_TOKEN:?}" "${IMAGE_TAG:?}"
[[ "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]]
app_url="${COOLIFY_URL%/}/api/v1/applications/${COOLIFY_APP_UUID}"
payload=$(jq -n --arg tag "$IMAGE_TAG" '{docker_registry_image_tag: $tag}')
curl --fail --silent --show-error --max-time 30 \
  -X PATCH "$app_url" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H 'Content-Type: application/json' --data "$payload" --output /dev/null
curl --fail --silent --show-error --max-time 30 \
  "$app_url/stop" -H "Authorization: Bearer $COOLIFY_TOKEN" --output /dev/null
# REQUIRED HERE: poll application status until the old container is stopped.
# Fail after a bounded timeout; an accepted stop request is only queued.
# Only after confirmed stop, request the replacement:
curl --fail --silent --show-error --max-time 30 \
  --get "${COOLIFY_URL%/}/api/v1/deploy" \
  --data-urlencode "uuid=$COOLIFY_APP_UUID" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" --output deployment.json
```

This is an API-call outline. The runnable implementation is
`scripts/deploy-backend.sh`; it uses `GET /api/v1/applications/{uuid}` to inspect status, then polls the returned
deployment UUID with `GET /api/v1/deployments/{deployment_uuid}` until finished
or failed. Coolify v4 application responses may report composite lifecycle/
health values such as `running:healthy` or `exited:unhealthy`;
`scripts/deploy-backend.sh` validates the lifecycle component and fails on
unknown states. Confirm the installed Coolify version's exact values during
setup. Bound the whole operation to ten minutes. A webhook HTTP 200 means the
job was accepted, not that the new version is healthy.

The [application update API](https://coolify.io/docs/api-reference/api/applications/update-application-by-uuid)
sets the exact image tag; the [stop API](https://coolify.io/docs/api-reference/api/applications/stop-application-by-uuid)
queues shutdown, and the [deploy API](https://coolify.io/docs/api-reference/api/deployments/deploy-by-tag-or-uuid)
returns the deployment identifier. Pin reviewed GitHub actions to commit SHAs
and validate the workflow with actionlint before enabling it.

After deployment finishes, check public `/api/health` and `/api/challenges`, and
verify in Coolify that the running image digest matches the published digest.
Health alone cannot identify the deployed revision. Keep the previous image tag
and digest in the release record. Failed tests must not reach publish/deploy;
failed deployment must fail the GitHub job and notify the maintainer.

#### 7. Validate once, then use the automatic workflow

Perform the first deployment with `EXECUTION_ENABLED=false`. Verify HTTPS,
catalog access, login/logout, admin access, and persistence across a restart.
Run the provider smoke from the container terminal using its runtime environment:

```bash
node scripts/smoke-e2b.js
```

After the provider smoke passes, enable execution for a controlled acceptance
window and perform the browser checks under Verification below before opening
public traffic. Test a real workspace preview, not just the unused preview base
hostname. Confirm wildcard TLS, WebSocket interaction, grading, and a second
user's isolation. Disable execution again if any check fails.

Finally, merge a harmless change and confirm the entire pipeline deploys its
exact SHA without SSH. Prove a deliberately failing test blocks deployment in a
test branch/staging setup, then remove that test. Confirm the database survives
redeployment and only one API container accesses it at a time.

#### 8. Updates, backups, and recovery

Backend updates briefly interrupt API requests and active terminal/preview
connections. Shutdown and restart reconciliation terminate old workspaces;
saved browser drafts and persistent account progress survive. Schedule updates
away from active assessments until session draining is implemented.

Set up daily encrypted off-VM SQLite backups with retention and test restoration.
Use SQLite's online backup mechanism, or stop the backend before copying the
database and its WAL. Back up Coolify configuration separately. Before a release
that changes the database schema, take and verify a fresh backup.

If a deployment fails, inspect the deployment logs, retain the database volume,
set the image tag back to the recorded previous SHA, and perform the same
stop-before-start deployment. Validate health and login afterward. Image rollback
does not undo database migrations: confirm schema compatibility before starting
old code, or use a deliberate maintenance restore that accounts for any writes
since the backup. Do not automatically restore old data on a health-check failure.

| Symptom | Check first |
| --- | --- |
| Image cannot be pulled | Lowercase GHCR name, SHA exists, VM architecture, private-package read permission. |
| SQLite permission error or lost progress | Persistent `/data` mount and UID/GID ownership; correct `DATABASE_PATH`. |
| API works but preview fails | Wildcard DNS/certificate, Host preserved, port 4002 routing. |
| Login returns but session disappears | Same-site custom domains, OAuth callback, exact APP/API origins and HTTPS. |
| CI is green but no new version | Publish/deploy job conditions, API permissions, deployment UUID result and running digest. |
| 429 behind the proxy | Edge limits and backend's shared proxy-IP limit; do not blindly trust forwarded IP headers. |

Keep the VM, Docker, and Coolify patched, watch disk use, and retain known-good
images for recovery. E2B key rotation, template updates, DNS changes, and VM
maintenance remain operational tasks; ordinary application changes are automated.

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

The live smoke creates the interactive workspace through the API, checks that
server-held `tests/` files are absent from its file snapshot, submits through
the API into a separate grading sandbox, and exercises network, permission,
output, timeout, and cleanup behavior. Cleanup failures are reported after all
known sandboxes have been attempted.

Then verify GitHub login in a browser, Python REPL input, Ctrl+C, resizing,
reconnection, terminal/editor edits and conflicts, CineMatch preview and restart,
and grading the reference solution. Check a second user's isolation, quota
responses, provider outages, and cleanup after a backend restart before enabling
public traffic. Automated fake-provider tests are not proof of a live deployment.
