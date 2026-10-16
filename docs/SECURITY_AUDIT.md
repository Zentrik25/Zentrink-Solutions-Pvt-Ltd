# Security audit (pre-launch)

**Scope and method.** Self-audit of the application code, configuration and build output by the
engineering team, backed by automated tests (`tests/security`, `tests/integration`, 163 tests in
total) and live checks against a production build. This is **not** an independent penetration
test. Findings below are those discovered *and fixed* during the audit, followed by residual risks.

## Result
No open Critical or High findings in application code. Residual risks are listed explicitly.

## What was tested and how
| Area | Test | Result |
|---|---|---|
| Authentication | Login success/failure, generic error for unknown vs wrong password, lockout after 5 failures, per-IP and per-email rate limits, inactive accounts, expired/forged sessions, hashed session tokens | Pass |
| Session security | HttpOnly, SameSite=Lax, Secure in production, `__Host-` prefix in production, 8 h expiry, server-side revocation on deactivation / password reset / role change | Pass |
| Admin authorisation | Static scan: every admin page calls `requirePage`, layout enforces auth, every admin route handler authorises | Pass |
| Server Action authorisation | Every exported Server Action routes through `guarded()`; **every privileged domain function (26) rejects anonymous callers**; editor role cannot reach sales/user/settings functions; export lists are pinned so a new unreviewed function fails the test | Pass |
| API access control | `/api/cron/*` and detailed `/api/health` need the secret; attachments and quotation PDFs return 401 anonymous, 403 wrong role, 404 mismatched ids | Pass |
| Private files | Client documents live in a separate private store, are never publicly addressable, stream only to authorised staff with `attachment`, `nosniff`, `no-store`, sandbox CSP; downloads are audit-logged | Pass |
| Input validation | Zod on every form; server-side revalidation; date, enum, length and format limits; slug regex also enforced by database CHECKs; money and consent enforced by database CHECKs | Pass |
| Injection | SQL-injection payloads in enquiry fields, inbox search and rate-limit keys stored/searched literally; all raw SQL is parameterised tagged templates | Pass |
| XSS | Hostile text rendered through React and JSON-LD stays inert; email templates HTML-escape all user content; no `eval`/`innerHTML` | Pass |
| CSRF | Server Actions use Next.js built-in Origin/Host verification (plus `allowedOrigins`); state is never changed by GET; session cookie is SameSite=Lax | Pass (architecture) |
| Rate limiting | PostgreSQL-backed windows: login (IP + email), enquiry (IP + email), verified under concurrency | Pass |
| File upload | Size, count, declared MIME **and** magic-byte signature must agree; extension must match; executables and SVG rejected; filenames sanitised; separate public/private stores | Pass |
| Secrets | No credential patterns in tracked files; `.env*` never tracked; only three allow-listed `NEXT_PUBLIC_` variables; **no secret/URL strings found in the built client bundle** | Pass |
| Security headers | HSTS, CSP (object-src none, frame-ancestors none, base-uri/form-action self, no unsafe-eval), nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, COOP; admin/API `no-store` + `noindex` | Pass (live header check) |
| Sensitive logging | All logging via a redacting JSON logger (emails/phones masked); a test fails on any stray `console.*` | Pass |
| Dependencies | `npm audit --omit=dev`: **0 vulnerabilities** | Pass |

## Findings fixed during this audit
1. **Authorisation ran after validation** in content-save functions (Phase 2 test found it): unauthenticated callers could trigger validation paths. Now authorisation is the first statement in every save function; tests cover it.
2. **JSON-LD script injection**: content containing `</script>` could have broken out of structured-data tags. All JSON-LD now escapes `<` and line separators.
3. **Preview indexing leak**: page metadata set `robots: undefined`, overriding the layout's noindex on previews. Fixed; previews now send header, meta tag and `Disallow: /`.
4. **Dashboard** relied on the layout only; it now calls `requirePage()` itself.
5. **Session cookie** now uses the `__Host-` prefix in production.
6. **Client IP source** prefers Vercel's non-spoofable `x-vercel-forwarded-for`.
7. **Email header injection**: subject lines strip line breaks and are length-capped.
8. **Logging**: errors could previously include raw provider/database messages; now redacted and structured.
9. **Settings**: social-image URL must be `https://` or a site path.
10. **Missing headers** (CSP, COOP, HSTS includeSubDomains) added; `*.vercel.app` aliases get a noindex header (host rule configured; can only be observed on Vercel).

## Residual risks and recommendations
| Risk | Severity | Mitigation / recommendation |
|---|---|---|
| No MFA for administrators | Medium | Enforce long unique passwords now; add TOTP/passkeys before adding many staff |
| CSP allows `'unsafe-inline'` scripts (Next.js inline bootstrap) | Low | Other CSP directives are strict. Nonce-based CSP would force dynamic rendering of every page; revisit if the threat model changes |
| Account lockout can be triggered by an attacker (15 min) | Low | Per-IP limits slow it; recovery script exists |
| Uploaded documents are not virus-scanned | Medium | Files are never executed or served inline; staff download them as attachments. Add a scanning step (e.g. ClamAV worker) if volume grows |
| No platform WAF rules configured | Medium | Add Vercel Firewall rate-limit rules for login and the enquiry form, enable Bot Protection |
| Email authentication depends on DNS | Medium | Configure SPF, DKIM, DMARC for `zentriksolutions.com` |
| Vercel Blob, Resend and live Postgres integrations are untested against real accounts | **Must verify on preview** | Checklist section C |
| Dev-tooling `npm audit` findings (`braces`) | Low | Not shipped; documented in OPERATIONS.md |
