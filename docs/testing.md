# Testing

All local checks are credential-free and use temporary databases or fake
providers. They must not load `.env` files or contact OAuth, E2B, or public
network services.

```bash
cd apps/backend && npm ci && npm test
cd ../frontend && npm ci && npm test && npm run build && npm run lint
cd ../.. && python3 apps/backend/test/workspace-files.test.py
python3 scripts/test-cinematch-preview.py
docker build -f scripts/challenge-runner.Dockerfile -t heisenbug-challenge-runner:ci .
python3 scripts/test-challenges.py
```

The required GitHub workflow also builds `apps/backend/Dockerfile` from the
repository root, starts the image with execution disabled, and verifies that
health reports the tested commit SHA and that the catalog is available. This
guards the production image context, challenge packaging, non-root runtime, and
deployment health contract.

`test-challenges.py` validates every metadata contract, copies starter and
solution plus server-held tests to isolated temporary directories, and runs
them in a disposable non-root Docker container with no network, a read-only
workspace, CPU/memory/process/file-count limits, and a timeout. It requires the
solution to pass while the starter fails. Use `--challenge 001` for a focused
run and `--json` for a machine-readable report. Use `--runner local` only for
local debugging when Docker is unavailable; never use that mode in CI. The
backend and frontend `test:coverage` scripts use Node's built-in coverage
instrumentation.
Live E2B checks are intentionally separate and run only from the trusted
workflow in `.github/workflows/e2b-smoke.yml`.

Playwright uses a production frontend build and a real Fastify server with an
injected fake E2B provider. Install its local browser prerequisites once with
`npx playwright install --with-deps chromium`, then run `npm run test:e2e` from
`apps/frontend`. CI installs these prerequisites automatically.

The initial frontend coverage report records the current baseline; it does not
yet enforce the target thresholds in the plan. Raise and enforce thresholds as
the remaining component matrix is implemented, without excluding application
modules to inflate the result.
