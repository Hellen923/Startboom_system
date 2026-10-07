#!/bin/bash
set -euo pipefail
umask 077
exec 9>/run/lock/coremintcrm-backup.lock
flock -n 9 || exit 0
destination=/var/backups/coremintcrm
install -d -m 700 "$destination"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
archive="$destination/mongodb-$stamp.archive.gz"
uploads_archive="$destination/uploads-$stamp.tar.gz"
trap 'rm -f "$archive.tmp" "$uploads_archive.tmp"' EXIT
docker exec coremintcrm-mongodb-1 sh -c 'exec mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --db coremintcrm --archive --gzip' > "$archive.tmp"
uploads_path=$(docker volume inspect --format '{{.Mountpoint}}' coremintcrm_uploads)
tar -C "$uploads_path" -czf "$uploads_archive.tmp" .
mv "$archive.tmp" "$archive"
mv "$uploads_archive.tmp" "$uploads_archive"
find "$destination" \( -name 'mongodb-*.archive.gz' -o -name 'uploads-*.tar.gz' \) -mtime +14 -delete
