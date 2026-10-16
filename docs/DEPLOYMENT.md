# Deployment guide (Vercel)

Nothing in this repository deploys itself to production. Every step below that changes DNS or
production is performed deliberately by an authorised person.

## 0. What the build needs (verified from a clean checkout)
| Database state at build time | Result |
|---|---|
| `DATABASE_URL` missing | build fails |
| Empty database (no migrations) | build fails (`Article` table does not exist) |
| Migrated, **not seeded** | would build an **empty site** |
| Migrated and seeded | builds (37 pages) |

`scripts/vercel-build.sh` now runs `scripts/preflight.ts` before `next build` on Vercel production and preview builds. It **fails the build with a plain explanation** when `AUTH_SECRET` (32+ chars) is missing, `CRON_SECRET` (16+ chars, production) is missing, the database has pending migrations, or (production) it has no published content. Missing email/Blob settings only warn. `/api/health` also returns HTTP 503 `misconfigured` if `AUTH_SECRET`/`DATABASE_URL`/(production) `CRON_SECRET` are missing at runtime.

**Plan requirement:** `vercel.json` schedules the email-retry cron every 10 minutes. Vercel's Hobby plan only allows daily crons and is expected to reject the deployment; use **Pro**, or change the schedule to `0 6 * * *`.

**Node.js:** `package.json` pins `engines.node` to `22.x` (the version everything was tested on).

## 1. Services to provision
| Need | Recommended managed service | Notes |
|---|---|---|
| PostgreSQL | **Neon** (Vercel Marketplace), **Postgres 16** | Gives a pooled and a direct URL, point-in-time restore, and per-preview **database branches**. Choose version 16 (the tested version). Pick the region nearest the function region. |
| Object storage | **Vercel Blob**: create **two stores** | One *public* (website images), one *private* (client documents). Connect them with env prefixes **`BLOB_PUBLIC`** and **`BLOB_PRIVATE`** so the tokens are named `BLOB_PUBLIC_READ_WRITE_TOKEN` and `BLOB_PRIVATE_READ_WRITE_TOKEN` (the code requires these exact names and explicit tokens). |
| Email | **Resend** | Verify the `zentriksolutions.com` sending domain (SPF + DKIM; add DMARC) before launch. |
| Monitoring | Vercel Observability + an external uptime monitor | See OPERATIONS.md. |

## 2. Vercel project
1. Import the Git repository. Framework is detected as Next.js. `vercel.json` sets the build command (`scripts/vercel-build.sh`), install command and the cron job.
2. Node.js version: 22 or newer.
3. Keep the function region next to the database region (Project Settings -> Functions).
4. Enable **Deployment Protection** (Vercel Authentication) for Preview deployments so previews are private. Previews are also `noindex` by header, meta tag and robots.txt.

## 3. Environment variables
Set in Project Settings -> Environment Variables. **Production and Preview must use different databases and stores.**

| Variable | Production | Preview | Secret |
|---|---|---|---|
| `DATABASE_URL` (pooled) | production DB | preview DB branch | yes |
| `DIRECT_URL` (direct) | production DB | preview DB branch | yes |
| `AUTH_SECRET` | unique random 32+ chars | different random value | yes |
| `CRON_SECRET` | random 16+ chars | random | yes |
| `BLOB_PUBLIC_READ_WRITE_TOKEN` | production public store | preview public store | yes |
| `BLOB_PRIVATE_READ_WRITE_TOKEN` | production private store | preview private store | yes |
| `RESEND_API_KEY` | live key | sandbox key, or unset (emails stay queued) | yes |
| `EMAIL_FROM` | `Zentrik Solutions <info@zentriksolutions.com>` (verified domain) | same, or unset | no |
| `COMPANY_NOTIFICATION_EMAIL` | `info@zentriksolutions.com` | a test inbox | no |
| `NEXT_PUBLIC_SITE_URL` | `https://zentriksolutions.com` | `https://zentriksolutions.com` (keeps canonicals consistent) | no |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 ID | leave unset | no |
| `NEXT_PUBLIC_GSC_VERIFICATION` | Search Console token | leave unset | no |
| `PREVIEW_AUTO_MIGRATE` | **never set** | `1` (only if preview DB is isolated) | no |

`VERCEL_ENV` is set by Vercel; only `production` is indexable.

Generate secrets with: `openssl rand -base64 48`.

## 4. Database release process (controlled; never automatic in production)
1. Schema changes are committed as Prisma migrations and reviewed in a pull request. CI runs them against a fresh PostgreSQL 16.
2. Previews with `PREVIEW_AUTO_MIGRATE=1` apply migrations to the preview database branch only.
3. For production run the GitHub workflow **Release - database migration** (manual, requires approval on the `production` environment). It:
   - runs `scripts/migration-guard.ts`, which **blocks** `DROP TABLE/COLUMN`, `TRUNCATE`, `ALTER COLUMN TYPE`, `DELETE` without `WHERE` and similar unless a human re-runs with the override;
   - takes a verified `pg_dump` backup and stores it as a private artifact;
   - runs `prisma migrate deploy`.
4. Only then promote the deployment. Prefer backwards-compatible (expand/contract) migrations so the previous deployment still works if you roll back.
5. First launch: run the workflow (or `npx prisma migrate deploy` locally with the production `DIRECT_URL`), then `SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run db:seed` once. **Do this before the first production deploy**, because pages are generated at build time from the database.

## 5. Domains and redirects
- Add `zentriksolutions.com` (primary) and `www.zentriksolutions.com`.
- In Vercel -> Domains set `www.zentriksolutions.com` to **redirect to** `zentriksolutions.com` with a **308 (permanent)** redirect. The application also enforces this (`next.config.ts`), so it holds even if the domain setting is missed.
- DNS (at your registrar/DNS host; **do not change until launch is approved**): `A zentriksolutions.com -> 76.76.21.21` and `CNAME www -> cname.vercel-dns.com` (use the exact values Vercel shows for your project). HTTPS certificates are issued automatically once DNS resolves.
- Verify ownership: Vercel may ask for a TXT record if the domain is attached to another account.

## 6. Safe first-deployment sequence
Steps marked **[approval]** must not be done without explicit written approval.

1. Create the Vercel project (Pro plan), Neon project (Postgres 16) and the two Blob stores. Set the variables in section 3, keeping Preview and Production values separate.
2. In Neon create a **staging branch**. Run `prisma migrate deploy` and `npm run db:seed` against it using its direct URL. Point the **Preview** scope at it. No production data is touched.
3. Deploy a **preview** from a branch. Deployment Protection is on, so give the test runner a bypass secret (`x-vercel-protection-bypass`). Run `BASE_URL=<preview> node tests/e2e/run.mjs`. Confirm a real email arrives, an attachment reaches the private store, an image upload works, and `/api/health` with the cron secret shows every integration `true` and `configProblems: []`.
4. **[approval]** Create the GitHub `production` environment (required reviewers) with secrets `PRODUCTION_DIRECT_URL` and `BACKUP_ENCRYPTION_PASSPHRASE`. Run **Release - database migration** against production. The backup is encrypted before upload (decrypt with `gpg --decrypt file.dump.gpg > file.dump`).
5. **[approval]** Seed production once: `SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... DIRECT_URL=<prod direct> npm run db:seed`.
6. **[approval]** Deploy to **Production** (preflight must pass). Verify it on its `.vercel.app` URL.
7. **[approval]** Add `zentriksolutions.com` and `www.zentriksolutions.com` in Vercel; set www to redirect to the apex with 308.
8. **[approval]** Change DNS last. Wait for the certificate. Verify both hostnames, re-run the e2e suite against production, submit the sitemap, change the seeded admin password.

## 7. After the preview is green
Follow RELEASE_CHECKLIST.md. Promotion to production requires explicit approval.
