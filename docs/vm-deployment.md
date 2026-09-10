# Backend deployment on an Ubuntu VM

The Coolify setup and automatic GHCR deployment are documented in
[`execution.md`](execution.md#vm-setup-with-coolify-and-automatic-deployment) and
are the preferred production path. This page is the standalone Docker Compose
alternative for a VM without Coolify.

This bundle runs the Fastify API and preview gateway in one backend container,
with persistent SQLite storage and Nginx TLS termination. Candidate code runs
only in E2B; the VM never executes submissions.

The example uses these hosts:

- Frontend: https://heisenbug.kashyaphegde.com
- API: https://heisenbug-api.kashyaphegde.com
- Preview base: https://heisenbug-preview.kashyaphegde.com
- Workspace previews: https://WORKSPACE_ID.heisenbug-preview.kashyaphegde.com

## DNS and certificates

Create A or AAAA records pointing these names to the VM:

    heisenbug-api.kashyaphegde.com
    heisenbug-preview.kashyaphegde.com
    *.heisenbug-preview.kashyaphegde.com

Obtain one certificate covering all three names through an ACME DNS challenge.
Place it at deploy/certs/fullchain.pem and its private key at
deploy/certs/privkey.pem. Both the certificates and production environment file
are excluded from Git.

## GitHub OAuth and E2B

Configure the GitHub OAuth homepage as https://heisenbug.kashyaphegde.com and
the callback as
https://heisenbug-api.kashyaphegde.com/api/auth/callback.

Build and test the E2B runtime template from a trusted machine:

    cd apps/backend
    E2B_API_KEY=... E2B_TEMPLATE=heisenbug-python node scripts/build-template.js
    E2B_API_KEY=... E2B_TEMPLATE=heisenbug-python node scripts/smoke-e2b.js

Copy deploy/production.env.example to deploy/production.env on the VM. Fill in
the E2B key, GitHub OAuth credentials, and numeric administrator GitHub IDs.
Keep EXECUTION_ENABLED=false until smoke and deployed health checks pass.

## Start and verify

Install Docker Engine with the Compose plugin, clone the trusted release commit,
then run:

    cd deploy
    docker compose -f compose.yml build --pull
    docker compose -f compose.yml up -d
    docker compose -f compose.yml ps
    docker compose -f compose.yml logs --tail=100 backend
    curl --fail https://heisenbug-api.kashyaphegde.com/api/health

Build the frontend with the public API origin:

    VITE_API_BASE=https://heisenbug-api.kashyaphegde.com npm run build

Verify GitHub login, workspace creation, terminal input, grading, logout cleanup,
and a web-preview challenge. Confirm the preview base and a generated workspace
hostname have valid TLS. Then enable execution in production.env and run:

    docker compose -f deploy/compose.yml up -d --force-recreate backend

Back up the heisenbug-data volume with SQLite's online backup mechanism or while
the backend is stopped. Deploy one backend replica because live terminal sessions
and quota reservations are held in process memory.
