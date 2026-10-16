#!/usr/bin/env bash
# Logical backup of the production database (custom format, compressed, with checksum).
# Usage: DIRECT_URL=postgres://... ./scripts/backup.sh [output-dir]
# Managed point-in-time recovery (e.g. Neon) is the primary safety net; this is the portable second copy.
set -euo pipefail
: "${DIRECT_URL:?DIRECT_URL is required}"
out="${1:-backups}"
mkdir -p "$out"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
file="$out/zentrik-$stamp.dump"
pg_dump --format=custom --compress=9 --no-owner --no-privileges "$DIRECT_URL" --file "$file"
sha256sum "$file" > "$file.sha256"
pg_restore --list "$file" > /dev/null   # fails if the archive is unreadable
echo "Backup written: $file ($(du -h "$file" | cut -f1))"
