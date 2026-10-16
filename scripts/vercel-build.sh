#!/usr/bin/env bash
# Vercel build entry point (see vercel.json).
#
#  * Production: NEVER migrates. Schema changes go through the approval-gated
#    "Release - database migration" workflow, which takes a verified backup first.
#  * Preview: migrates ONLY if PREVIEW_AUTO_MIGRATE=1 is set on the Preview scope, and
#    only when DIRECT_URL points at an isolated preview database (e.g. a Neon branch).
set -euo pipefail

npx prisma generate

if [ "${VERCEL_ENV:-}" = "preview" ] && [ "${PREVIEW_AUTO_MIGRATE:-0}" = "1" ]; then
  echo "Preview deployment: applying migrations to the isolated preview database"
  npx prisma migrate deploy
elif [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "Production deployment: migrations are NOT run automatically."
  echo "If this release changes the schema, run the 'Release - database migration' workflow BEFORE promoting."
fi

npx next build
