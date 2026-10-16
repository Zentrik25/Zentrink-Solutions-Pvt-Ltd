# Operations runbook

## Backups
| Layer | What | How | Verified |
|---|---|---|---|
| Primary | Managed point-in-time recovery | Neon (history window depends on plan; confirm it covers your needs) | Must be verified on the live account |
| Secondary | Portable logical dump | `DIRECT_URL=... ./scripts/backup.sh` (custom format, compressed, SHA-256, archive listing test). Runs automatically before every production migration in the release workflow | Yes (local) |
| Files | Vercel Blob | Blob is durable storage but has no versioning. Export both stores periodically (`vercel blob` CLI or an API script) if client documents are business-critical | Not automated |

**Restore test (do this before launch and quarterly):**
```bash
SOURCE_URL=<prod direct url> SCRATCH_URL=<EMPTY scratch database url> ./scripts/restore-test.sh
```
It restores a fresh dump into the scratch database and compares row counts for every table.
Local result: `RESTORE OK: 23 tables, all row counts match.` The script refuses to run if the scratch and source URLs are equal.

## Monitoring
- **Liveness:** `GET /api/health` -> `{"status":"ok","database":"ok"}`; HTTP 503 if the database is unreachable. Point two uptime checks at it and at `/`.
- **Email and integration health:** `GET /api/health` with `Authorization: Bearer $CRON_SECRET` adds `email.pending/failed/oldestUndeliveredMinutes` and `integrations.*`. `status` becomes `degraded` when any send has permanently failed, mail has been stuck over 30 minutes, or email is not configured. Alert when `status != "ok"` (Better Stack, UptimeRobot with keyword + header, Checkly, etc.).
- **Admin dashboard** shows a banner when notifications are undelivered; every enquiry shows its notification status and last error.
- **Logs:** structured JSON lines (`level`, `event`, `time`, `env`, `commit`, redacted fields). Events to alert on: `email.send_failed`, `email.provider_not_configured`, `enquiry.transaction_failed`, `enquiry.attachment_upload_failed`, `health.database_unreachable`, `request.unhandled_error`, `audit.write_failed`. Use Vercel Logs search or a Log Drain. Emails and phone numbers are redacted from logs.
- **Unhandled errors:** `instrumentation.ts` logs every uncaught server error as `request.unhandled_error`. Add Sentry from the Vercel Marketplace if you want grouped issues and release tracking (not installed).

## Rollback
- **Code:** Vercel -> Deployments -> previous good deployment -> *Instant Rollback* (no rebuild).
- **Content:** drafts/published state is data; unpublish from the admin.

## Migration recovery
1. Migrations are additive by policy (expand/contract); the guard blocks destructive SQL.
2. If a migration fails midway: Prisma records it as failed. Do **not** re-run blindly. Inspect with `npx prisma migrate status`, fix forward with a new migration, or mark resolved with `prisma migrate resolve` after manual correction.
3. If data is damaged: restore the pre-migration backup (release workflow artifact, 7 days) or use Neon point-in-time restore into a **new branch**, verify it, then repoint `DATABASE_URL`/`DIRECT_URL`.
4. Then roll back the deployment to the version compatible with the restored schema.

## Administrator access recovery
From a trusted machine with the production `DIRECT_URL`:
```bash
ADMIN_NEW_PASSWORD='A-new-Strong-Passw0rd' npx tsx scripts/admin-recover.ts you@example.com                  # reset
ADMIN_NEW_PASSWORD='A-new-Strong-Passw0rd' npx tsx scripts/admin-recover.ts you@example.com --create "Name"   # create super admin
```
It enforces the password policy, unlocks and reactivates the account, revokes every session and writes an audit-log entry. The password comes from the environment, never from command-line arguments. Lock-outs after 5 failed sign-ins last 15 minutes and clear themselves.

## Dependency and security updates
- Dependabot opens weekly grouped PRs (`.github/dependabot.yml`); CI (`.github/workflows/ci.yml`) runs type check, lint, 163 tests, a production build and `npm audit --omit=dev --audit-level=high` on each.
- A weekly scheduled audit (`security.yml`) fails on moderate+ production vulnerabilities.
- Known, accepted: `npm audit` reports `braces` (via `eslint-config-next` -> `fast-glob`) in **development tooling only**; it is not shipped or executed in production, and the suggested fix would downgrade Next.js. Revisit when `eslint-config-next` updates.

## Environment variables
Manage in Vercel (Project Settings -> Environment Variables) or with `vercel env add/pull`. Rotate `AUTH_SECRET` (signs only short-lived anti-spam tokens and IP hashes; rotating is safe and invalidates open forms), `CRON_SECRET`, Resend and Blob tokens whenever someone with access leaves. Never commit `.env` files (a test enforces this).

## Routine tasks
| Frequency | Task |
|---|---|
| Daily | Glance at the dashboard banner / health status |
| Weekly | Review Dependabot PRs; check failed notifications (`status = degraded`) |
| Quarterly | Run the restore test; review admin accounts; rotate secrets if staff changed |
| Per release | Release checklist; migration workflow if the schema changed |
