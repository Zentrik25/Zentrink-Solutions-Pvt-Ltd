import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getArticles, getIndustries, getProjects, getServices } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [SERVICES, PROJECTS, ARTICLES, INDUSTRIES] = await Promise.all([
    getServices(),
    getProjects(),
    getArticles(),
    getIndustries(),
  ]);
  const staticRoutes = [
    "",
    "/services",
    "/about",
    "/projects",
    "/industries",
    "/insights",
    "/contact",
    "/request-a-quote",
    "/privacy-policy",
    "/terms-of-use",
  ];
  return [
    ...staticRoutes.map((r) => ({ url: `${SITE.url}${r}`, priority: r === "" ? 1 : 0.8 })),
    ...SERVICES.map((s) => ({ url: `${SITE.url}/services/${s.slug}`, priority: 0.8 })),
    ...INDUSTRIES.map((i) => ({ url: `${SITE.url}/industries/${i.slug}`, priority: 0.7 })),
    ...PROJECTS.map((p) => ({ url: `${SITE.url}/projects/${p.slug}`, priority: 0.6 })),
    ...ARTICLES.map((a) => ({
      url: `${SITE.url}/insights/${a.slug}`,
      lastModified: a.published,
      priority: 0.6,
    })),
  ];
}
