import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { SERVICES } from "@/lib/services";
import { ARTICLES } from "@/lib/articles";
import { PROJECTS } from "@/lib/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/services", "/about", "/projects", "/industries", "/insights", "/contact"];
  return [
    ...staticRoutes.map((r) => ({ url: `${SITE.url}${r}`, priority: r === "" ? 1 : 0.8 })),
    ...SERVICES.map((s) => ({ url: `${SITE.url}/services/${s.slug}`, priority: 0.8 })),
    ...PROJECTS.map((p) => ({ url: `${SITE.url}/projects/${p.slug}`, priority: 0.6 })),
    ...ARTICLES.map((a) => ({
      url: `${SITE.url}/insights/${a.slug}`,
      lastModified: a.published,
      priority: 0.6,
    })),
  ];
}
