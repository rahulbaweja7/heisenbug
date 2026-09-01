#!/usr/bin/env bash
# Watches the repo for file changes and auto-commits them (no push).
# Usage: ./scripts/auto-commit.sh [debounce-seconds]
#
# Stop with Ctrl+C, or `pkill -f auto-commit.sh`.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEBOUNCE="${1:-5}"

cd "$REPO_ROOT"

echo "Watching $REPO_ROOT for changes (debounce: ${DEBOUNCE}s, branch: $(git branch --show-current))"
echo "Auto-commits only -- nothing is pushed automatically."

fswatch -o \
  --exclude '\.git/' \
  --exclude 'node_modules/' \
  --exclude 'dist/' \
  --exclude '__pycache__/' \
  --exclude '\.pytest_cache/' \
  . | while read -r _; do
    sleep "$DEBOUNCE"

    if [[ -z "$(git status --porcelain)" ]]; then
      continue
    fi

    git add -A
    git commit -m "auto: workspace snapshot $(date '+%Y-%m-%d %H:%M:%S')" --quiet
    echo "Committed $(date '+%H:%M:%S') on $(git branch --show-current): $(git log -1 --oneline)"
  done
