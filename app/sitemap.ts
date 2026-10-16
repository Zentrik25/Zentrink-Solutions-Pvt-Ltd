import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { db } from "@/lib/server/db";

export const revalidate = 3600;

/**
 * Built from PUBLISHED database rows only. Drafts, admin routes, API endpoints and
 * private files can never appear because they are never queried or listed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const published = { status: "PUBLISHED" as const };
  const [services, industries, projects, articles] = await Promise.all([
    db().service.findMany({ where: published, select: { slug: true, updatedAt: true } }),
    db().industry.findMany({ where: published, select: { slug: true, updatedAt: true } }),
    db().project.findMany({ where: published, select: { slug: true, updatedAt: true } }),
    db().article.findMany({ where: published, select: { slug: true, updatedAt: true } }),
  ]);
  const latest = (rows: { updatedAt: Date }[]) => rows.reduce<Date | undefined>((m, r) => (!m || r.updatedAt > m ? r.updatedAt : m), undefined);

  const entry = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"], lastModified?: Date) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency,
    priority,
  });

  return [
    entry("/", 1, "weekly"),
    entry("/services", 0.9, "monthly", latest(services)),
    ...services.map((s) => entry(`/services/${s.slug}`, 0.9, "monthly", s.updatedAt)),
    entry("/industries", 0.7, "monthly", latest(industries)),
    ...industries.map((i) => entry(`/industries/${i.slug}`, 0.7, "monthly", i.updatedAt)),
    entry("/projects", 0.7, "weekly", latest(projects)),
    ...projects.map((p) => entry(`/projects/${p.slug}`, 0.6, "yearly", p.updatedAt)),
    entry("/insights", 0.7, "weekly", latest(articles)),
    ...articles.map((a) => entry(`/insights/${a.slug}`, 0.6, "yearly", a.updatedAt)),
    entry("/about", 0.6, "yearly"),
    entry("/contact", 0.8, "yearly"),
    entry("/request-a-quote", 0.8, "yearly"),
    entry("/privacy-policy", 0.2, "yearly"),
    entry("/terms-of-use", 0.2, "yearly"),
  ];
}
