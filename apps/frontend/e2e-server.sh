#!/usr/bin/env bash
set -euo pipefail
cookie_file="${HEISENBUG_COOKIE_FILE:-/tmp/heisenbug-test-cookies.json}"
VITE_API_BASE=http://127.0.0.1:4001 npm run build
node ../backend/test/e2e-launcher.js > /tmp/heisenbug-backend.log 2>&1 & backend=$!
trap 'kill "$backend" 2>/dev/null || true' EXIT
for i in $(seq 1 50); do grep -q HEISENBUG_TEST_READY /tmp/heisenbug-backend.log && break; sleep .1; done
grep -q HEISENBUG_TEST_READY /tmp/heisenbug-backend.log || { cat /tmp/heisenbug-backend.log; exit 1; }
exec npm run preview -- --host 127.0.0.1
