#!/usr/bin/env bash
set -euo pipefail

: "${COOLIFY_URL:?COOLIFY_URL is required}"
: "${COOLIFY_APP_UUID:?COOLIFY_APP_UUID is required}"
: "${COOLIFY_TOKEN:?COOLIFY_TOKEN is required}"
: "${IMAGE_TAG:?IMAGE_TAG is required}"
[[ "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]] || { echo 'IMAGE_TAG must be a full commit SHA' >&2; exit 2; }

coolify="${COOLIFY_URL%/}/api/v1"
auth="Authorization: Bearer $COOLIFY_TOKEN"
app_url="$coolify/applications/$COOLIFY_APP_UUID"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

request() {
  curl --fail --silent --show-error --max-time 30 "$@"
}

payload="$(jq -n --arg tag "$IMAGE_TAG" '{docker_registry_image_tag: $tag}')"
request -X PATCH "$app_url" -H "$auth" -H 'Content-Type: application/json' \
  --data "$payload" --output /dev/null
request "$app_url/stop" -H "$auth" --output /dev/null

deadline=$((SECONDS + 180))
while (( SECONDS < deadline )); do
  request "$app_url" -H "$auth" --output "$tmp_dir/app.json"
  status="$(jq -r '.status // empty' "$tmp_dir/app.json")"
  case "$status" in
    stopped|stopped:*|exited|exited:*) break ;;
    running:*|running|restarting|stopping) sleep 5 ;;
    *) echo "Unexpected Coolify stop status: ${status:-missing}" >&2; exit 1 ;;
  esac
done
[[ "$status" == stopped || "$status" == stopped:* || "$status" == exited || "$status" == exited:* ]] || { echo 'Timed out stopping the previous container' >&2; exit 1; }

request --get "$coolify/deploy" --data-urlencode "uuid=$COOLIFY_APP_UUID" \
  -H "$auth" --output "$tmp_dir/deploy.json"
deployment_id="$(jq -r '.deployments[0].deployment_uuid // .deployment_uuid // .uuid // empty' "$tmp_dir/deploy.json")"
[[ -n "$deployment_id" ]] || { echo 'Coolify did not return a deployment UUID' >&2; exit 1; }

deadline=$((SECONDS + 600))
while (( SECONDS < deadline )); do
  request "$coolify/deployments/$deployment_id" -H "$auth" --output "$tmp_dir/status.json"
  status="$(jq -r '.status // empty' "$tmp_dir/status.json")"
  case "$status" in
    finished|success|succeeded) break ;;
    queued|pending|in_progress|running) sleep 10 ;;
    failed|cancelled|canceled|error) echo "Coolify deployment ended with $status" >&2; exit 1 ;;
    *) echo "Unexpected Coolify deployment status: ${status:-missing}" >&2; exit 1 ;;
  esac
done
case "$status" in finished|success|succeeded) ;; *) echo 'Timed out waiting for Coolify deployment' >&2; exit 1 ;; esac

request --retry 8 --retry-all-errors --retry-delay 5 \
  "${API_ORIGIN:?API_ORIGIN is required}/api/health" --output "$tmp_dir/health.json"
jq -e --arg revision "$IMAGE_TAG" '.ok == true and .revision == $revision' "$tmp_dir/health.json" >/dev/null
request --retry 3 --retry-all-errors --retry-delay 2 \
  "$API_ORIGIN/api/challenges" --output "$tmp_dir/challenges.json"
jq -e 'type == "array" and length > 0' "$tmp_dir/challenges.json" >/dev/null

request "$app_url" -H "$auth" --output "$tmp_dir/final-app.json"
running_tag="$(jq -r '.docker_registry_image_tag // empty' "$tmp_dir/final-app.json")"
[[ "$running_tag" == "$IMAGE_TAG" ]] || { echo "Coolify reports image tag $running_tag, expected $IMAGE_TAG" >&2; exit 1; }
echo "Deployed backend commit $IMAGE_TAG"
