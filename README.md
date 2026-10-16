# Zentrik Solutions (Pvt) Ltd: public website (Phase 1)

Next.js App Router, TypeScript, Tailwind CSS. No separate backend.

```bash
npm install
npm run dev        # development
npm run lint && npx tsc --noEmit && npm run build
```

## Data access
All pages read content through the async functions in `lib/data.ts`. In Phase 1 they return typed content from `lib/*.ts`; in Phase 2 replace each body with a PostgreSQL query and keep the signatures.

## Content sources
- `lib/site.ts`: company details, navigation, WhatsApp number
- `lib/services.ts`, `lib/industries.ts`, `lib/articles.ts`: page content
- `lib/projects.ts`: verified project register (empty until verified case studies are supplied)
- `lib/enquiry.ts`: enquiry validation and `deliverEnquiry()`, the Phase 2 backend integration point

## Notes
- The logo is `public/logo.png`; photography is in `public/images` (stock imagery, not Zentrik projects).
- Set `NEXT_PUBLIC_SITE_URL` in production for canonical URLs and the sitemap.
