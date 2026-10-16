# Deployment guide (Vercel)

Nothing in this repository deploys itself to production. Every step below that changes DNS or
production is performed deliberately by an authorised person.

## 1. Services to provision
| Need | Recommended managed service | Notes |
|---|---|---|
| PostgreSQL | **Neon** (Vercel Marketplace) | Gives a pooled and a direct URL, point-in-time restore, and per-preview **database branches**. Pick the region nearest the function region. |
| Object storage | **Vercel Blob**: create **two stores** | One *public* (website images), one *private* (client documents). Separate tokens. |
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

## 6. After the preview is green
Follow RELEASE_CHECKLIST.md. Promotion to production requires explicit approval.
