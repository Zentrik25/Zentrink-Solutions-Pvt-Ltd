# Zentrik Solutions (Pvt) Ltd

Next.js (App Router) + TypeScript + Tailwind + Prisma/PostgreSQL. One application: public website,
admin dashboard (`/admin`), enquiry workflow, quotations, CMS. Deploys to Vercel; no separate backend.

## Local development
```bash
npm install                       # also runs `prisma generate`
cp .env.example .env              # fill in values (see below)
npx prisma migrate deploy         # apply migrations to your database
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='A-strong-Passw0rd' npm run db:seed
npm run dev
```
The seed loads the Phase 1 website content into the database (it never overwrites content you have
since edited) and creates the first super administrator.

## Checks
```bash
npm run typecheck && npm run lint && npm test && npm run build
```
Tests use a real PostgreSQL database (`TEST_DATABASE_URL`, default `localhost:5433/zentrik_test`);
migrations are applied automatically before the run and tables are reset between tests.

## Environment variables
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | **Pooled** PostgreSQL URL used by the running app |
| `DIRECT_URL` | Direct (non-pooled) URL used only by `prisma migrate` |
| `AUTH_SECRET` | 32+ random characters; hashes IPs and signs anti-spam tokens |
| `CRON_SECRET` | Authorises Vercel Cron calls to `/api/cron/notifications` |
| `BLOB_PUBLIC_READ_WRITE_TOKEN` | Vercel Blob store (public) for website images |
| `BLOB_PRIVATE_READ_WRITE_TOKEN` | Separate Vercel Blob store (private) for client documents |
| `RESEND_API_KEY` | Transactional email |
| `EMAIL_FROM` | Sender on a domain **verified in Resend**, e.g. `Zentrik Solutions <info@zentriksolutions.com>` |
| `COMPANY_NOTIFICATION_EMAIL` | Default recipient for new-enquiry alerts (editable in Settings) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL |

## Vercel
- Build command (in `vercel.json`): `prisma generate && prisma migrate deploy && next build`. Both database URLs must be available at build time.
- Cron: `/api/cron/notifications` retries undelivered emails every 10 minutes. Vercel's Hobby plan only allows daily crons; change the schedule in `vercel.json` if you are on Hobby. New enquiry emails are still attempted immediately after each submission.
- Enquiry attachments: Vercel limits request bodies to 4.5 MB, so uploads are capped at 3 files / 4 MB in total.

## Architecture notes
- **Data access:** public pages read published content only through `lib/data.ts`; drafts cannot leak.
- **Authorisation:** every Server Action, Route Handler and domain function calls `authorize(permission)` itself (`lib/auth`). Roles: SUPER_ADMIN, ADMIN, EDITOR, SALES.
- **Email reliability:** enquiries and emails are decoupled. Notifications are rows in `EmailNotification` (an outbox) created in the same transaction as the enquiry, sent after the response, and retried with backoff by cron. Provider idempotency keys prevent duplicates.
- **Rate limiting:** PostgreSQL-backed fixed windows (`RateLimit`), safe across serverless instances.
- **Files:** public images and private client documents live in separate stores. Private documents are only streamed through authenticated routes.
- **Quotations:** decimal arithmetic (`decimal.js`), `Decimal(14,2)` columns with CHECK constraints, USD only, PDFs generated on demand with `pdf-lib`.
