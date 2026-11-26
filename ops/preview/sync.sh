#!/bin/sh
set -eu

cd "$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
umask 077

docker_bin=${DOCKER_BIN:-docker}
repo=ssil-khu-ac-kr-refactoring/nextjs
registry="ghcr.io/$repo-preview"
lock=.sync-lock

if ! mkdir "$lock" 2>/dev/null; then
  echo 'Preview sync is already running.'
  exit 0
fi
trap 'rm -f "$lock/pulls.json" "$lock/refs"; rmdir "$lock"' EXIT
trap 'exit 1' HUP INT TERM

compose() {
  "$docker_bin" compose --env-file .env.preview -p ssil-pr-preview -f compose.yml "$@"
}

containers() {
  service=$1
  shift
  "$docker_bin" ps --filter label=com.docker.compose.project=ssil-pr-preview \
    --filter "label=com.docker.compose.service=$service" "$@"
}

set_preview_ref() {
  export SSIL_PREVIEW_PR="$1" SSIL_PREVIEW_SHA="$2"
  export SSIL_PREVIEW_IMAGE="$registry:pr-$1-$2"
}

curl -fsS --max-time 20 -H 'Accept: application/vnd.github+json' \
  "https://api.github.com/repos/$repo/pulls?state=open&base=master&sort=created&direction=desc&per_page=100" \
  -o "$lock/pulls.json"
jq -r --arg repo "$repo" '
  if type != "array" then error("Unexpected GitHub response") else
    .[] | select(.head.repo.full_name == $repo) | [.number, .head.sha] | @tsv
  end' "$lock/pulls.json" > "$lock/refs"

active_image=$(containers preview-app -a --format '{{.Image}}')
healthy_image=$(containers preview-app --filter health=healthy --format '{{.Image}}')
gateway=$(containers preview-gateway -q)
active_open=false
tab=$(printf '\t')

while IFS="$tab" read -r number sha; do
  case "$number" in ''|*[!0-9]*) continue ;; esac
  case "$sha" in ''|*[!0-9a-f]*) continue ;; esac
  [ "${#sha}" -eq 40 ] || continue

  case "$active_image" in "$registry:pr-$number-"*) active_open=true ;; esac
  set_preview_ref "$number" "$sha"
  if [ "$healthy_image" = "$SSIL_PREVIEW_IMAGE" ] && [ -n "$gateway" ]; then
    echo "PR #$number is already running at $sha."
    exit 0
  fi
  if ! "$docker_bin" manifest inspect "$SSIL_PREVIEW_IMAGE" >/dev/null 2>&1; then
    continue
  fi

  compose config -q
  compose pull
  compose down
  compose up -d --wait --wait-timeout 150
  echo "Preview ready for PR #$number at $sha."
  exit 0
done < "$lock/refs"

if [ "$active_open" = false ] && [ -n "$active_image$gateway" ]; then
  set_preview_ref 0 0000000000000000000000000000000000000000
  compose down
fi
echo 'No newer eligible PR image is ready.'
