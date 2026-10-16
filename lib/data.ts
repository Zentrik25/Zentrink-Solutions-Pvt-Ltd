/**
 * Public data access layer (server only).
 *
 * Every function returns PUBLISHED content only. Drafts can never leak
 * through the public site because the status filter lives here, in the
 * single place all public pages read from.
 */
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/server/db";
import { getSetting } from "@/lib/content/settings";
import type { Service, ServiceIcon, ServiceImage } from "@/lib/services";
import type { Industry } from "@/lib/industries";
import type { Project, ProjectCategory } from "@/lib/projects";
import type { Article, Block } from "@/lib/articles";

const PUBLISHED = { status: "PUBLISHED" as const };

const FALLBACK_IMAGE: ServiceImage = {
  src: "/images/control-panel.jpg",
  alt: "Electrical control panel with wired modules",
  width: 1800,
  height: 1200,
};

type MediaLike = { url: string; alt: string; width: number | null; height: number | null } | null;

function toImage(m: MediaLike, fallbackAlt: string): ServiceImage {
  if (!m) return FALLBACK_IMAGE;
  return { src: m.url, alt: m.alt || fallbackAlt, width: m.width ?? 1600, height: m.height ?? 1067 };
}

const asArray = <T>(v: Prisma.JsonValue): T[] => (Array.isArray(v) ? (v as T[]) : []);

type ServiceRow = Prisma.ServiceGetPayload<{
  include: { image: true; related: { select: { slug: true; status: true } } };
}>;

function mapService(s: ServiceRow): Service {
  return {
    slug: s.slug,
    title: s.title,
    icon: s.icon as ServiceIcon,
    summary: s.summary,
    overview: s.overview,
    scope: s.scope,
    applications: s.applications,
    process: asArray<{ title: string; text: string }>(s.process),
    related: s.related.filter((r) => r.status === "PUBLISHED").map((r) => r.slug),
    faqs: asArray<{ q: string; a: string }>(s.faqs),
    image: toImage(s.image, s.title),
    seo: { title: s.seoTitle ?? undefined, description: s.seoDescription ?? undefined },
  };
}

const serviceInclude = { image: true, related: { select: { slug: true, status: true } } } as const;

export async function getServices(): Promise<Service[]> {
  const rows = await db().service.findMany({ where: PUBLISHED, orderBy: { sortOrder: "asc" }, include: serviceInclude });
  return rows.map(mapService);
}

export async function getService(slug: string): Promise<Service | undefined> {
  const row = await db().service.findFirst({ where: { slug, ...PUBLISHED }, include: serviceInclude });
  return row ? mapService(row) : undefined;
}

export async function getServiceSeo(slug: string) {
  return db().service.findFirst({ where: { slug, ...PUBLISHED }, select: { seoTitle: true, seoDescription: true } });
}

function mapIndustry(i: Prisma.IndustryGetPayload<{ include: { services: { select: { slug: true; status: true } } } }>): Industry {
  return {
    slug: i.slug,
    title: i.title,
    summary: i.summary,
    needs: i.needs,
    challenges: i.challenges,
    approach: i.approach,
    faqs: asArray<{ q: string; a: string }>(i.faqs),
    services: i.services.filter((s) => s.status === "PUBLISHED").map((s) => s.slug),
    seo: { title: i.seoTitle ?? undefined, description: i.seoDescription ?? undefined },
  };
}
const industryInclude = { services: { select: { slug: true, status: true } } } as const;

export async function getIndustries(): Promise<Industry[]> {
  const rows = await db().industry.findMany({ where: PUBLISHED, orderBy: { sortOrder: "asc" }, include: industryInclude });
  return rows.map(mapIndustry);
}

export async function getIndustry(slug: string): Promise<Industry | undefined> {
  const row = await db().industry.findFirst({ where: { slug, ...PUBLISHED }, include: industryInclude });
  return row ? mapIndustry(row) : undefined;
}

export async function getIndustriesForService(serviceSlug: string): Promise<Industry[]> {
  const rows = await db().industry.findMany({
    where: { ...PUBLISHED, services: { some: { slug: serviceSlug, ...PUBLISHED } } },
    orderBy: { sortOrder: "asc" },
    include: industryInclude,
  });
  return rows.map(mapIndustry);
}

type ProjectRow = Prisma.ProjectGetPayload<{
  include: { services: { select: { slug: true; status: true } }; images: { include: { media: true } } };
}>;

function mapProject(p: ProjectRow): Project {
  return {
    slug: p.slug,
    title: p.title,
    category: p.category as ProjectCategory,
    client: p.client ?? undefined,
    location: p.location,
    year: p.year,
    summary: p.summary,
    description: p.description,
    specifications: asArray<{ label: string; value: string }>(p.specifications),
    services: p.services.filter((s) => s.status === "PUBLISHED").map((s) => s.slug),
    seo: { title: p.seoTitle ?? undefined, description: p.seoDescription ?? undefined },
    gallery: [...p.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((im) => ({ src: im.media.url, alt: im.alt || im.media.alt || p.title, width: im.media.width ?? 1600, height: im.media.height ?? 1067 })),
  };
}
const projectInclude = {
  services: { select: { slug: true, status: true } },
  images: { include: { media: true } },
} as const;

export async function getProjects(): Promise<Project[]> {
  const rows = await db().project.findMany({ where: PUBLISHED, orderBy: { publishedAt: "desc" }, include: projectInclude });
  return rows.map(mapProject);
}

export async function getFeaturedProjects(limit = 3): Promise<Project[]> {
  const rows = await db().project.findMany({
    where: { ...PUBLISHED, featured: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: projectInclude,
  });
  return rows.map(mapProject);
}

export async function getProject(slug: string): Promise<Project | undefined> {
  const row = await db().project.findFirst({ where: { slug, ...PUBLISHED }, include: projectInclude });
  return row ? mapProject(row) : undefined;
}

type ArticleRow = Prisma.ArticleGetPayload<{ include: { category: true } }>;

function mapArticle(a: ArticleRow): Article {
  return {
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.category.name,
    published: (a.publishedAt ?? a.createdAt).toISOString().slice(0, 10),
    body: asArray<Block>(a.body),
    seo: { title: a.seoTitle ?? undefined, description: a.seoDescription ?? undefined },
  };
}

export async function getArticles(): Promise<Article[]> {
  const rows = await db().article.findMany({ where: PUBLISHED, orderBy: { publishedAt: "desc" }, include: { category: true } });
  return rows.map(mapArticle);
}

export async function getArticle(slug: string): Promise<Article | undefined> {
  const row = await db().article.findFirst({ where: { slug, ...PUBLISHED }, include: { category: true } });
  return row ? mapArticle(row) : undefined;
}

export async function getArticleCategories(): Promise<string[]> {
  const rows = await db().articleCategory.findMany({
    where: { articles: { some: PUBLISHED } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { name: true },
  });
  return rows.map((r) => r.name);
}

/** Editable contact details with their derived link forms. */
export async function getContact() {
  const c = await getSetting("contact");
  return { ...c, phoneHref: `tel:${c.phone.replace(/[^\d+]/g, "")}`, mailto: `mailto:${c.email}` };
}

export const getHomepage = () => getSetting("homepage");
export const getSeo = () => getSetting("seo");
