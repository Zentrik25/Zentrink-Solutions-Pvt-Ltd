# Release checklist

Tick every box on the **Preview** deployment first. Production promotion needs written approval.
Status column shows what was verified in the build sandbox (S) versus what must be verified on Vercel (V).

## A. Accounts and ownership
- [ ] (V) Domain ownership confirmed; registrar access available
- [ ] (V) Vercel project created; Git repo connected; Deployment Protection on for Previews
- [ ] (V) Production and preview databases are **different**; preview uses a Neon branch
- [ ] (V) Separate public and private Blob stores for production

## B. Configuration
- [ ] (V) All variables in DEPLOYMENT.md set for the correct scopes
- [ ] (V) `/api/health` with the cron secret shows `integrations.email`, `storagePublic`, `storagePrivate`, `cron` all `true`
- [ ] (V) Resend sending domain verified (SPF, DKIM, DMARC); `EMAIL_FROM` uses it
- [ ] (V) Database migrated and seeded; first super administrator signs in; password changed from the seed value

## C. Functional (run `BASE_URL=<preview> node tests/e2e/run.mjs`)
- [x] (S) Visitor -> service page -> enquiry form -> database -> admin inbox -> dashboard
- [x] (S) Admin -> create project -> publish -> public page -> sitemap -> delete
- [x] (S) Admin -> create article -> publish -> SEO metadata -> public article
- [x] (S) Admin -> enquiry -> quotation -> PDF (and PDF refused to anonymous)
- [x] (S) All 42 public URLs: 200, one h1, unique title, description, canonical, image alts
- [x] (S) Mobile menu and no overflow at 360/390/768/1440 px
- [ ] (V) Real enquiry with a PDF attachment: file appears in the private store, downloads only when signed in
- [ ] (V) Company notification and client acknowledgement **arrive in real inboxes** (check spam and headers)
- [ ] (V) Quotation email arrives with the PDF attached
- [ ] (V) Image upload in Media reaches the public Blob store and renders on the site

## D. SEO
- [x] (S) `robots.txt` blocks everything on previews, allows the site on production; `/admin` and `/api/` disallowed
- [x] (S) Previews send `X-Robots-Tag: noindex` and `<meta name="robots" content="noindex">`
- [x] (S) Sitemap lists published content only (drafts, admin, API absent)
- [x] (S) Canonical = `https://zentriksolutions.com/...` everywhere; www redirects 308
- [ ] (V) After launch: submit `https://zentriksolutions.com/sitemap.xml` in Search Console; request indexing of the home page
- [ ] (V) Rich Results Test on a service page and an article
- [ ] (V) Google Business Profile created only once a real address/service-area policy is decided (docs/SEO.md)

## E. Security
- [x] (S) Authorisation matrix and 163 automated tests pass (docs/SECURITY_AUDIT.md)
- [ ] (V) Security headers present on the deployed URL (`curl -I`)
- [ ] (V) Vercel Firewall: rate-limit rule for `POST /admin/login` and `/request-a-quote`; Bot Protection on
- [ ] (V) Admin accounts: unique strong passwords for every user; remove the seed account if unused

## F. Operations
- [ ] (V) Neon point-in-time restore window confirmed; one test restore performed (OPERATIONS.md)
- [x] (S) `scripts/backup.sh` + `scripts/restore-test.sh` verified (23 tables, counts match)
- [ ] (V) Uptime monitor on `https://zentriksolutions.com/api/health` (alert on non-200) and a second on the home page
- [ ] (V) Alert on `/api/health` detail endpoint `status != ok` (email backlog / failed sends)
- [ ] (V) Vercel Log Drain or notification for runtime errors configured
- [ ] (V) Dependabot enabled; GitHub `production` environment requires reviewers

## G. Analytics
- [x] (S) No Google request before consent; decline persists; accept loads GA; events carry no personal data
- [ ] (V) GA4 Realtime shows page views and `generate_lead`, `phone_click`, `email_click`, `whatsapp_click`, `service_enquiry_click` after accepting on the preview
- [ ] (V) Mark `generate_lead` as a key event in GA4

## H. Go-live (needs explicit approval)
1. Promote the verified preview (or merge to the production branch).
2. Add/verify domains; switch DNS; wait for the certificate.
3. Verify `https://zentriksolutions.com` and `https://www.zentriksolutions.com` (the latter must 308 to the former).
4. Re-run the e2e suite against production (it cleans up after itself); submit the sitemap.
5. Watch logs and `/api/health` for the first hour.

## I. Rollback
Vercel -> Deployments -> select the last good deployment -> **Instant Rollback**. If a migration was applied, follow "Migration recovery" in OPERATIONS.md.
