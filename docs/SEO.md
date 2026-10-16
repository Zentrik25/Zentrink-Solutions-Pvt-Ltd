# SEO, local SEO and analytics

## Technical SEO (implemented and verified on a production build)
| Item | Implementation | Verified |
|---|---|---|
| Metadata | One builder (`lib/seo.ts#pageMetadata`) gives every page a unique title, description, canonical, Open Graph and Twitter card. Titles are kept near 60 characters (the brand suffix is dropped rather than truncating the keywords) | e2e crawl: 42 URLs, titles unique, descriptions 50-175 chars |
| Canonical | Always `https://zentriksolutions.com/...` (apex, https) regardless of the host served. `www` -> apex 308 in app config and (to be set) in Vercel Domains | live `curl` |
| Social images | Branded Open Graph image per service, industry, article and project (`opengraph-image.tsx`) plus a site default | page head inspected |
| Sitemap | `/sitemap.xml` built from **published database rows only**; `lastModified` from `updatedAt`; admin, API and drafts impossible to include | automated + e2e (draft hidden, publish adds, delete removes) |
| robots.txt | Production: allow `/`, disallow `/admin` and `/api/`, sitemap + host. Anything else (preview/branch/local): `Disallow: /` | live `curl`, unit tests |
| noindex controls | Header `X-Robots-Tag` and meta robots on every non-production deployment; `/admin/*` and `/api/*` always `noindex, no-store`; internal search results (`/insights?q=`) are `noindex,follow`; 404 pages are `noindex` | live `curl` |
| Structured data | `Organization` (+`LocalBusiness` only when an address is entered), `WebSite`, `BreadcrumbList` on every inner page, `Service` on service pages, `Article` (with publisher logo) on articles. All JSON-LD is script-safe | e2e parses the JSON-LD |
| Clean URLs | `/services/electrical-installations`, `/power-distribution`, `/solar-energy`, `/industrial-maintenance`, `/testing-commissioning`, `/electrical-procurement`, `/industries/<sector>`, `/insights/<slug>`, `/projects/<slug>` | sitemap |
| Redirects | `www` -> apex (308); `/blog`, `/blog/:slug`, `/quote`, `/contact-us`, `/about-us` -> canonical (308) | live `curl` |
| Rendering | All public content is server-rendered/ISR HTML (revalidates every 5 minutes and instantly on publish) | `view-source` |
| Images | `next/image` (AVIF/WebP, responsive `sizes`), descriptive alt text on every content image (e2e fails on missing alt) | e2e |
| Internal linking | Services <-> related services <-> industries <-> articles; footer links every service and industry; breadcrumbs everywhere | e2e crawl follows all links |
| Search Console | Set `NEXT_PUBLIC_GSC_VERIFICATION` to the HTML-tag token -> `<meta name="google-site-verification">` is emitted (verified). After launch: verify property, submit `/sitemap.xml` | tag verified |

## Zimbabwe search strategy
Target themes map to dedicated, distinct pages (no duplicate "city" pages):

| Search theme | Landing page | Title (<= 65 chars with brand) |
|---|---|---|
| Electrical engineering company Zimbabwe | `/` | Electrical Engineering Company Zimbabwe \| Zentrik Solutions |
| Electrical contractors / installations Zimbabwe | `/services/electrical-installations` | Electrical Installations Zimbabwe |
| Power distribution contractors Zimbabwe | `/services/power-distribution` | Power Distribution Contractors Zimbabwe |
| Solar installation Zimbabwe | `/services/solar-energy` | Solar Installation Zimbabwe |
| Industrial electrical maintenance Zimbabwe | `/services/industrial-maintenance` | Industrial Electrical Maintenance Zimbabwe |
| Electrical testing and commissioning Zimbabwe | `/services/testing-commissioning` | Electrical Testing & Commissioning Zimbabwe |
| Electrical equipment procurement Zimbabwe | `/services/electrical-procurement` | Electrical Equipment Procurement Zimbabwe |
| Sector queries (mining, agriculture, etc.) | `/industries/<sector>` | Electrical Engineering for <Sector> |

Content: each service page has an overview, scope, applications, delivery process, **5-6 FAQs that answer real buyer questions** (how to choose a contractor, LV vs MV, whether solar needs approval, test intervals, what information is needed to source switchgear...), related services and relevant industries; seven original technical articles support the long tail. Content states general engineering guidance only: **no invented project experience, certifications, years in business, staff numbers, reviews or office locations.** Editors can refine titles/descriptions per page in Admin -> SEO fields; changes go live immediately.

**Content roadmap (needs real material):** verified project case studies with photographs; articles on topics clients ask about; the team's real qualifications.

## Local SEO readiness
| Fact | Status |
|---|---|
| Business name `Zentrik Solutions (Pvt) Ltd` | Published, consistent everywhere (site, schema, emails, PDFs) |
| Phone `+263 78 823 6186`, WhatsApp, email `info@zentriksolutions.com` | Published, consistent; editable in Admin -> Settings |
| Service area | "Projects across Zimbabwe" (Country-level `areaServed`) |
| **Physical address** | **Not provided, therefore not published.** `LocalBusiness` schema is automatically added only after an address is saved in Admin -> Settings -> Address |
| Opening hours, registration number, social profiles | Not provided; not published |
| Reviews | None published; none will be fabricated. Collect real client reviews via Google Business Profile after launch |
| Photography | Current images are licensed **stock** imagery used illustratively. Replace with genuine project and team photographs (upload in Admin -> Media) |

**Google Business Profile steps once facts exist:** (1) decide whether Zentrik serves customers at a physical location or is a *service-area business* (GBP allows hiding the address for the latter); (2) create the profile using the exact business name, phone and `https://zentriksolutions.com`; (3) choose categories (e.g. Electrical contractor, Solar energy contractor); (4) upload genuine photos; (5) complete Google's verification; (6) keep name/phone/URL identical to the website (NAP consistency).

## Analytics (GA4) and conversions
- Set `NEXT_PUBLIC_GA_MEASUREMENT_ID`. A consent banner appears; **no Google script or cookie loads until the visitor accepts**; the choice persists and is changeable from "Cookie settings" in the footer. Verified: 0 Google requests before consent and after decline.
- Events (verified in a real browser): `generate_lead` (enquiry saved; params: form name + service slug), `phone_click`, `email_click`, `whatsapp_click`, `service_enquiry_click` (service slug). Parameters contain **only page path / service slug**; no names, emails, phone numbers or free text. Google Signals and ad personalisation are off.
- In GA4: Admin -> Events -> mark `generate_lead` as a key event; optionally create audiences for `whatsapp_click`.
- Privacy Policy documents analytics, consent and what is never sent.
