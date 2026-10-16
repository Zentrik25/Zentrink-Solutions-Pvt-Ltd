# Performance report

## How this was measured (read this first)
- Lighthouse 12 (Chromium headless), **against a production build (`next build` + `next start`) running in the build sandbox with a local PostgreSQL** - **not** against a deployed Vercel preview. No Vercel access exists in the sandbox, so deployed-preview scores **have not been measured** and must be re-measured on the preview (`npx lighthouse https://<preview>/ ...`, or PageSpeed Insights once the site is public).
- Mobile = Lighthouse default (Moto G-class emulation, simulated slow 4G, 4x CPU slowdown). Desktop = Lighthouse desktop preset.
- Local runs have no CDN, so TTFB is optimistic; on Vercel static pages are served from the edge cache, which usually improves LCP further, while Image Optimisation cold starts can add to the first hit.
- INP is a *field* metric and cannot be measured in a lab run; Total Blocking Time is reported as its lab proxy. Real INP/LCP/CLS should be read from Search Console's Core Web Vitals report after launch.

## Results (final build, analytics configured so the consent banner is visible)
**Mobile**
| Page | Perf | A11y | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 93 | 100 | 100 | 100 | 3.1 s | 0 | 70 ms |
| `/services/solar-energy` | 94 | 100 | 100 | 100 | 3.1 s | 0 | 40 ms |
| `/insights/why-pre-energisation-testing-matters` | 97 | 100 | 100 | 100 | 2.7 s | 0 | 30 ms |
| `/contact` | 95 | 100 | 100 | 100 | 2.8 s | 0 | 90 ms |
| `/request-a-quote` | 93 | 100 | 100 | 100 | 3.2 s | 0 | 40 ms |
| `/about` | 96 | 100 | 100 | 100 | 2.8 s | 0 | 50 ms |

**Desktop** (same pages): Performance **100**, Accessibility **100**, Best Practices **100**, SEO **100**; LCP 0.6-0.7 s, CLS 0, TBT 0 ms.

All 90+ targets are met in the lab. SEO scores assume production indexing (`ALLOW_INDEXING=1`); previews intentionally score lower on SEO because they are `noindex`.

## What was found and fixed
| Finding (from Lighthouse) | Fix | Effect |
|---|---|---|
| Hero LCP image had no `fetchpriority=high` (Next 16 deprecated `priority`) | `fetchPriority="high"` + `loading="eager"` on hero, service and project lead images | Home mobile 83 -> 93 |
| Logo (1813 px) served ~10x larger than displayed | `sizes` attribute so the optimiser serves a small variant | -14 KiB, LCP |
| Colour-contrast failures (step numerals, grey labels) | Darkened `steel-500`, used `accent-strong` for orange text on light backgrounds | A11y 96 -> 100 |
| Enquiry form fetched an anti-bot token on every page load | Token is now requested on first interaction with the form | One fewer request at load |
| `/services` overflowed at 768 px (e2e) | 5-column layout moved to `lg` | No horizontal scroll at any tested width |

## Architecture notes
- Public pages are statically generated with ISR (5 min) and revalidated on demand when content is published, so visitors rarely wait on the database.
- Dynamic pages (`/insights` search, `/contact`, `/request-a-quote`) use a pooled connection (`max: 1` per instance; the pooler provides concurrency); all list queries filter on indexed columns (`status`, `publishedAt`, `slug`).
- Fonts are self-hosted by `next/font` (no third-party font request). Images are AVIF/WebP with responsive `sizes`.
- First-load JS is limited to React/Next plus small client islands (header menu, enquiry form, consent banner).

## Known remaining items
- Home mobile LCP (3.1 s lab) is dominated by the hero photograph; replacing the stock image with a smaller, art-directed crop of a real project photo is the best next gain.
- 71 KB shared chunk reports ~40% unused JS in lab (framework code); no action planned.
