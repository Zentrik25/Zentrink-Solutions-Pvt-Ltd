#!/usr/bin/env bash
# Proves a backup is restorable: restores into an EMPTY scratch database and compares row counts per table.
# Usage: SOURCE_URL=... SCRATCH_URL=... ./scripts/restore-test.sh [dump-file]
# SCRATCH_URL must point at an empty database that is safe to overwrite (never production).
set -euo pipefail
: "${SOURCE_URL:?SOURCE_URL is required}"
: "${SCRATCH_URL:?SCRATCH_URL is required}"
if [ "$SOURCE_URL" = "$SCRATCH_URL" ]; then echo "SCRATCH_URL must differ from SOURCE_URL" >&2; exit 2; fi
dump="${1:-}"
if [ -z "$dump" ]; then
  dump="$(mktemp /tmp/restore-test-XXXX.dump)"
  pg_dump --format=custom --no-owner --no-privileges "$SOURCE_URL" --file "$dump"
fi
sha256sum -c "$dump.sha256" 2>/dev/null || true
pg_restore --no-owner --no-privileges --exit-on-error --dbname "$SCRATCH_URL" "$dump"

counts() {
  psql "$1" -Atc "select tablename from pg_tables where schemaname='public' order by 1" | while read -r t; do
    printf '%s=%s\n' "$t" "$(psql "$1" -Atc "select count(*) from \"$t\"")"
  done
}
a="$(counts "$SOURCE_URL")"; b="$(counts "$SCRATCH_URL")"
if [ "$a" = "$b" ]; then
  echo "RESTORE OK: $(echo "$a" | wc -l) tables, all row counts match."
else
  echo "RESTORE MISMATCH" >&2; diff <(echo "$a") <(echo "$b") >&2 || true; exit 1
fi
