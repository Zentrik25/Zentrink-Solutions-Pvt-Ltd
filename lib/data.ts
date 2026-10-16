/**
 * Server-side data access layer.
 *
 * Pages and components read content ONLY through these async functions.
 * In Phase 1 they resolve from the typed content modules in this folder.
 * In Phase 2, replace each body with a PostgreSQL query (for example
 * `await db.select().from(projects)`), keeping the signatures unchanged, so
 * no page or component needs to change.
 */
import { SITE } from "@/lib/site";
import { SERVICES, type Service } from "@/lib/services";
import { INDUSTRIES, type Industry } from "@/lib/industries";
import { PROJECTS, type Project } from "@/lib/projects";
import { ARTICLES, type Article } from "@/lib/articles";

export async function getSiteSettings() {
  return SITE;
}

export async function getServices(): Promise<Service[]> {
  return SERVICES;
}

export async function getService(slug: string): Promise<Service | undefined> {
  return SERVICES.find((s) => s.slug === slug);
}

export async function getIndustries(): Promise<Industry[]> {
  return INDUSTRIES;
}

export async function getIndustry(slug: string): Promise<Industry | undefined> {
  return INDUSTRIES.find((i) => i.slug === slug);
}

export async function getIndustriesForService(serviceSlug: string): Promise<Industry[]> {
  return INDUSTRIES.filter((i) => i.services.includes(serviceSlug));
}

export async function getProjects(): Promise<Project[]> {
  return PROJECTS;
}

export async function getFeaturedProjects(limit = 3): Promise<Project[]> {
  return PROJECTS.slice(0, limit);
}

export async function getProject(slug: string): Promise<Project | undefined> {
  return PROJECTS.find((p) => p.slug === slug);
}

export async function getArticles(): Promise<Article[]> {
  return [...ARTICLES].sort((a, b) => b.published.localeCompare(a.published));
}

export async function getArticle(slug: string): Promise<Article | undefined> {
  return ARTICLES.find((a) => a.slug === slug);
}
