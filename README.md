# Zentrik Solutions (Pvt) Ltd: public website (Phase 1)

Next.js App Router, TypeScript, Tailwind CSS. No separate backend.

```bash
npm install
npm run dev        # development
npm run lint && npx tsc --noEmit && npm run build
```

## Content sources
- `lib/site.ts`: company details, navigation, WhatsApp number
- `lib/services.ts`, `lib/industries.ts`, `lib/articles.ts`: page content
- `lib/projects.ts`: verified project register (empty until verified case studies are supplied)
- `lib/enquiry.ts`: enquiry validation and `deliverEnquiry()`, the Phase 2 backend integration point

## Notes
- The logo is a placeholder wordmark in `components/ui/logo.tsx`; replace it with the official file.
- Set `NEXT_PUBLIC_SITE_URL` in production for canonical URLs and the sitemap.
