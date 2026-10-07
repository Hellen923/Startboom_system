#!/bin/bash
set -euo pipefail
exec 9>/run/lock/coremintcrm-backup.lock
flock -n 9 || exit 0
destination=/var/backups/coremintcrm
install -d -m 700 "$destination"
archive="$destination/mongodb-$(date -u +%Y%m%dT%H%M%SZ).archive.gz"
docker exec coremintcrm-mongodb-1 sh -c 'exec mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --db coremintcrm --archive --gzip' > "$archive.tmp"
mv "$archive.tmp" "$archive"
chmod 600 "$archive"
find "$destination" -name 'mongodb-*.archive.gz' -mtime +14 -delete
