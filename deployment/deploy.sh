#!/bin/bash
set -euo pipefail
exec 9>/run/lock/coremintcrm-deploy.lock
flock -w 900 9
release=${1:-}
[[ $release =~ ^[0-9a-f]{40}$ ]] || exit 64
cd /opt/coremintcrm
compose=(docker compose --env-file /etc/coremintcrm/compose.env -f /opt/coremintcrm/compose.yaml)
export APP_VERSION=$release
registry_config=$(mktemp -d)
trap 'rm -rf "$registry_config"' EXIT
IFS= read -r registry_token
printf '%s' "$registry_token" | docker --config "$registry_config" login ghcr.io -u Hellen923 --password-stdin >&2
unset registry_token
image=ghcr.io/hellen923/startboom_system-crm
docker --config "$registry_config" pull "$image:$release" >&2
previous=$(cat current-version 2>/dev/null || true)
ready=false
if "${compose[@]}" up -d --no-deps app >&2; then
for attempt in $(seq 1 60); do
  id=$(${compose[@]} ps -q app)
  if [[ -n $id ]] && [[ $(docker inspect --format '{{.State.Health.Status}}' "$id") == healthy ]]; then
    ready=true
    break
  fi
  sleep 3
done
fi
if [[ $ready != true ]]; then
  echo 'New release failed readiness checks.' >&2
  if [[ -n $previous ]]; then
    export APP_VERSION=$previous
    "${compose[@]}" up -d --no-deps app >&2
    echo "Restored application version $previous" >&2
  else
    "${compose[@]}" stop app >&2
  fi
  exit 1
fi
if [[ $previous != "$release" && -n $previous ]]; then
  printf '%s\n' "$previous" > previous-version
fi
printf '%s\n' "$release" > current-version
previous=$(cat previous-version 2>/dev/null || true)
# Remove only old images belonging to this application; other VPS apps are untouched.
while IFS= read -r tag; do
  [[ $tag =~ ^[0-9a-f]{40}$ ]] || continue
  [[ $tag == "$release" || $tag == "$previous" ]] && continue
  docker image rm "$image:$tag" >&2 || true
done < <(docker image ls "$image" --format '{{.Tag}}')
printf 'retained_versions=%s%s\n' "$release" "${previous:+,$previous}"
