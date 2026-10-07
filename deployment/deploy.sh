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
# Optional second line keeps compatibility with earlier deployment clients.
email_settings=''
IFS= read -r email_settings || true
image=ghcr.io/hellen923/startboom_system-crm
docker --config "$registry_config" pull "$image:$release" >&2
previous=$(cat current-version 2>/dev/null || true)
cp /etc/coremintcrm/app.env "$registry_config/app.env.previous"
if [[ -n $email_settings ]]; then
  EMAIL_SETTINGS="$email_settings" python3 - <<'PYEMAIL'
import base64, json, os, tempfile
from pathlib import Path
path = Path('/etc/coremintcrm/app.env')
settings = json.loads(base64.b64decode(os.environ['EMAIL_SETTINGS'], validate=True))
allowed = {'BREVO_API_KEY', 'EMAIL_PASS', 'EMAIL_USER', 'EMAIL_FROM'}
if not isinstance(settings, dict) or set(settings) != allowed:
    raise ValueError('Invalid email settings')
if any(not isinstance(value, str) or any(c in value for c in '\r\n\0') for value in settings.values()):
    raise ValueError('Email settings must contain single-line values')
lines = [line for line in path.read_text().splitlines() if line.split('=', 1)[0] not in allowed]
lines += [key + '=' + json.dumps(value.replace('$', '$$')) for key, value in settings.items()]
fd, temporary = tempfile.mkstemp(dir=path.parent)
with os.fdopen(fd, 'w') as file:
    file.write('\n'.join(lines) + '\n')
os.replace(temporary, path)
PYEMAIL
fi
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
  install -m 600 "$registry_config/app.env.previous" /etc/coremintcrm/app.env
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
