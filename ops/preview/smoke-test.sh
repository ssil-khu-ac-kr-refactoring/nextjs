#!/bin/sh
set -eu

cd "$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"

export SSIL_PREVIEW_PORT=18091
export SSIL_PREVIEW_URL="http://127.0.0.1:$SSIL_PREVIEW_PORT"
export SSIL_PREVIEW_USER=ci-reviewer
password=local-smoke-test-only
export SSIL_PREVIEW_DB_PASSWORD=local-smoke-fixture-db
export SSIL_PREVIEW_NEXTAUTH_SECRET=local-smoke-fixture-session
SSIL_PREVIEW_PASSWORD_HASH=$(docker run --rm caddy:2-alpine caddy hash-password --plaintext "$password")
export SSIL_PREVIEW_PASSWORD_HASH

compose() {
  docker compose --env-file /dev/null -p ssil-pr-preview-smoke -f compose.yml "$@"
}

cleanup() {
  status=$?
  if [ "$status" -ne 0 ]; then compose logs --no-color || true; fi
  compose down || true
  exit "$status"
}
trap cleanup EXIT

request() {
  curl -sS --max-time 15 -u "$SSIL_PREVIEW_USER:$password" "$@"
}

compose config -q
compose up -d --wait --wait-timeout 150

origin="$SSIL_PREVIEW_URL"
status=$(curl -sS --max-time 15 --retry 5 --retry-connrefused --retry-delay 1 -o /dev/null -w '%{http_code}' "$origin/")
[ "$status" = 401 ]
status=$(curl -sS --max-time 15 -o /dev/null -w '%{http_code}' "$origin/__ssil_preview")
[ "$status" = 401 ]
info=$(request -f "$origin/__ssil_preview")
printf '%s' "$info" | grep -Fq "PR #$SSIL_PREVIEW_PR"
printf '%s' "$info" | grep -Fq "$SSIL_PREVIEW_SHA"
home=$(request -f "$origin/")
printf '%s' "$home" | grep -Fq 'Current Research'
printf '%s' "$home" | grep -Fq 'LUSEM'
request -f -o /dev/null "$origin/research?cat=Current&idx=3"
[ "$(request -o /dev/null -w '%{http_code}' "$origin/admin")" = 404 ]
[ "$(request -X POST -o /dev/null -w '%{http_code}' "$origin/api/home/content")" = 405 ]
