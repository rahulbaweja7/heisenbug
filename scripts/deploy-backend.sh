#!/usr/bin/env bash
set -euo pipefail

: "${COOLIFY_URL:?COOLIFY_URL is required}"
: "${COOLIFY_APP_UUID:?COOLIFY_APP_UUID is required}"
: "${COOLIFY_TOKEN:?COOLIFY_TOKEN is required}"
: "${IMAGE_TAG:?IMAGE_TAG is required}"
: "${API_ORIGIN:?API_ORIGIN is required}"
[[ "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]] || { echo 'IMAGE_TAG must be a full lowercase commit SHA' >&2; exit 2; }
if [[ -n "${IMAGE_DIGEST:-}" && ! "$IMAGE_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]]; then
  echo 'IMAGE_DIGEST must be a sha256 digest' >&2
  exit 2
fi

coolify="${COOLIFY_URL%/}/api/v1"
app_url="$coolify/applications/$COOLIFY_APP_UUID"
auth="Authorization: Bearer $COOLIFY_TOKEN"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

request() {
  curl --fail --silent --show-error --max-time 30 "$@"
}

status_from() {
  jq -r '.status // .application.status // .deployment.status // .data.status // empty' "$1"
}

# Coolify v4 may return a lifecycle:health value, for example
# running:healthy or exited:unhealthy. Validate the lifecycle component while
# retaining the raw value in diagnostics.
lifecycle_from() {
  local status="$1"
  printf '%s\n' "${status%%:*}"
}

payload="$(jq -n --arg tag "$IMAGE_TAG" '{docker_registry_image_tag: $tag}')"
request -X PATCH "$app_url" -H "$auth" -H 'Content-Type: application/json' \
  --data "$payload" --output /dev/null

request "$app_url/stop" -H "$auth" --output /dev/null
deadline=$((SECONDS + 180))
while (( SECONDS < deadline )); do
  request "$app_url" -H "$auth" --output "$tmp_dir/app.json"
  status="$(status_from "$tmp_dir/app.json")"
  lifecycle="$(lifecycle_from "$status")"
  case "$lifecycle" in
    stopped|exited) break ;;
    running|restarting|starting|stopping) sleep 5 ;;
    *) echo "Unexpected Coolify stop status: ${status:-missing}" >&2; exit 1 ;;
  esac
done
case "$lifecycle" in
  stopped|exited) ;;
  *) echo 'Timed out waiting for the previous container to stop' >&2; exit 1 ;;
esac

request --get "$coolify/deploy" --data-urlencode "uuid=$COOLIFY_APP_UUID" \
  -H "$auth" --output "$tmp_dir/deploy.json"
deployment_id="$(jq -r '.deployment_uuid // .deployments[0].deployment_uuid // .uuid // .data.deployment_uuid // empty' "$tmp_dir/deploy.json")"
[[ -n "$deployment_id" ]] || { echo 'Coolify did not return a deployment UUID' >&2; exit 1; }

deadline=$((SECONDS + 600))
while (( SECONDS < deadline )); do
  request "$coolify/deployments/$deployment_id" -H "$auth" --output "$tmp_dir/status.json"
  status="$(status_from "$tmp_dir/status.json")"
  lifecycle="$(lifecycle_from "$status")"
  case "$lifecycle" in
    finished|success|succeeded) break ;;
    queued|pending|in_progress|running|building|deploying) sleep 10 ;;
    failed|cancelled|canceled|error) echo "Coolify deployment ended with $status" >&2; exit 1 ;;
    *) echo "Unexpected Coolify deployment status: ${status:-missing}" >&2; exit 1 ;;
  esac
done
case "$lifecycle" in
  finished|success|succeeded) ;;
  *) echo 'Timed out waiting for Coolify deployment' >&2; exit 1 ;;
esac

request --retry 8 --retry-all-errors --retry-delay 5 \
  "$API_ORIGIN/api/health" --output "$tmp_dir/health.json"
jq -e --arg revision "$IMAGE_TAG" '.ok == true and .revision == $revision' "$tmp_dir/health.json" >/dev/null

request --retry 3 --retry-all-errors --retry-delay 2 \
  "$API_ORIGIN/api/challenges" --output "$tmp_dir/challenges.json"
jq -e 'type == "array" and length > 0' "$tmp_dir/challenges.json" >/dev/null

request "$app_url" -H "$auth" --output "$tmp_dir/final-app.json"
running_tag="$(jq -r '.docker_registry_image_tag // .application.docker_registry_image_tag // empty' "$tmp_dir/final-app.json")"
[[ "$running_tag" == "$IMAGE_TAG" ]] || { echo "Coolify reports image tag ${running_tag:-missing}, expected $IMAGE_TAG" >&2; exit 1; }

if [[ -n "${IMAGE_DIGEST:-}" ]]; then
  # Slurp both responses and select the first recognized value inside jq. Do
  # not pipe into head: with pipefail, jq can receive SIGPIPE after head exits.
  running_digest="$(jq -sr '[.[] | .. | objects | to_entries[] | select(.key == "image_digest" or .key == "docker_image_digest" or .key == "digest") | .value | select(type == "string" and test("^sha256:[0-9a-f]{64}$"))] | first // empty' "$tmp_dir/final-app.json" "$tmp_dir/status.json")"
  [[ -n "$running_digest" ]] || { echo 'Coolify did not expose a recognized GHCR image digest; validate the installed API response before enabling digest verification' >&2; exit 1; }
  [[ "$running_digest" == "$IMAGE_DIGEST" ]] || { echo "Coolify reports image digest ${running_digest:-missing}, expected $IMAGE_DIGEST" >&2; exit 1; }
fi

if [[ -n "${DEPLOYMENT_RECORD_FILE:-}" ]]; then
  jq -n --arg revision "$IMAGE_TAG" --arg digest "${IMAGE_DIGEST:-}" --arg deployment "$deployment_id" \
    '{revision: $revision, imageDigest: ($digest | select(length > 0)), deploymentId: $deployment, verifiedAt: (now | todateiso8601)}' > "$DEPLOYMENT_RECORD_FILE"
fi
echo "Deployed backend commit $IMAGE_TAG"
