import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const CANONICAL_ORIGIN = SITE.url.replace(/\/$/, "");

export function absoluteUrl(path = "/"): string {
  return `${CANONICAL_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Search engines may index ONLY the real production deployment. Previews,
 * branch deployments and local builds are always noindex. Self-hosted
 * production can opt in with ALLOW_INDEXING=1.
 */
export function isIndexable(): boolean {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === "production";
  return process.env.ALLOW_INDEXING === "1";
}

type PageMeta = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  /** Keep the page out of search results (e.g. internal search result pages). */
  noindex?: boolean;
  publishedTime?: string;
  section?: string;
  /** Use the title exactly, without the site-name suffix. */
  absoluteTitle?: boolean;
};

/** Single source for canonical, Open Graph and Twitter metadata so every page is consistent. */
export function pageMetadata(m: PageMeta): Metadata {
  const url = absoluteUrl(m.path);
  const suffixed = `${m.title} | ${SITE.shortName}`;
  // Search results show about 60 characters: drop the brand suffix rather than truncate the useful part.
  const useSuffix = !m.absoluteTitle && suffixed.length <= 65;
  const fullTitle = useSuffix ? suffixed : m.title;
  return {
    title: useSuffix ? m.title : { absolute: m.title },
    description: m.description,
    alternates: { canonical: url },
    // Omitted (not undefined) when indexable, so the layout-level policy for previews still applies.
    ...(m.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: m.type ?? "website",
      siteName: SITE.name,
      locale: "en_ZW",
      title: fullTitle,
      description: m.description,
      url,
      ...(m.type === "article" ? { publishedTime: m.publishedTime, section: m.section } : {}),
    },
    twitter: { card: "summary_large_image", title: fullTitle, description: m.description },
  };
}

/** Serialises JSON-LD safely for inline <script>: `<` is escaped so content can never close the tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(new RegExp("\\u2028", "g"), "\\u2028")
    .replace(new RegExp("\\u2029", "g"), "\\u2029");
}
