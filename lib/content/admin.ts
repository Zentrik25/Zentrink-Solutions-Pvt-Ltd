import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { authorize } from "@/lib/auth/session";
import { PROJECT_CATEGORIES } from "@/lib/projects";
import { bodyToText, lines, pairs, paragraphs, parseBody, slugify } from "./parse";
import { revalidatePublicSite } from "./revalidate";

export type Result =
  | { ok: true; id?: string; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lower-case letters, numbers and hyphens only.")
  .max(80);

const optional = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => v || undefined);

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}
const all = (fd: FormData, key: string): string[] =>
  fd.getAll(key).filter((v): v is string => typeof v === "string" && v !== "");

function failure(error: z.ZodError): Result {
  const fieldErrors: Record<string, string> = {};
  for (const i of error.issues) fieldErrors[String(i.path[0] ?? "form")] ||= i.message;
  return { ok: false, error: "Please correct the highlighted fields.", fieldErrors };
}

function conflict(e: unknown): Result | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
    return { ok: false, error: "That slug or name is already in use.", fieldErrors: { slug: "Already in use." } };
  return null;
}

/** Moving content to PUBLISHED needs the publish permission; drafts only need write. */
async function authorizeStatus(status: "DRAFT" | "PUBLISHED", wasPublished: boolean) {
  const user = await authorize("content:write");
  if (status === "PUBLISHED" || wasPublished) await authorize("content:publish");
  return user;
}

const statusSchema = z.enum(["DRAFT", "PUBLISHED"]);

function publishData(status: "DRAFT" | "PUBLISHED", existing: { publishedAt: Date | null } | null) {
  return { status, publishedAt: status === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null) };
}

// ----- Services ---------------------------------------------------------------------------
export const SERVICE_ICONS = ["plug", "network", "sun", "wrench", "gauge", "package"] as const;

export async function saveService(id: string | null, fd: FormData): Promise<Result> {
  await authorize("content:write");
  const parsed = z
    .object({
      title: z.string().trim().min(2).max(120),
      slug: slugSchema,
      summary: z.string().trim().min(10).max(300),
      icon: z.enum(SERVICE_ICONS),
      status: statusSchema,
      sortOrder: z.coerce.number().int().min(0).max(999).default(0),
      seoTitle: optional(70),
      seoDescription: optional(170),
      imageId: optional(40),
    })
    .safeParse(Object.fromEntries(["title", "slug", "summary", "icon", "status", "sortOrder", "seoTitle", "seoDescription", "imageId"].map((k) => [k, str(fd, k)])));
  if (!parsed.success) return failure(parsed.error);
  const proc = pairs(str(fd, "process"));
  const faq = pairs(str(fd, "faqs"));
  if (proc.bad.length) return { ok: false, error: "Each process step needs the form: Title | Description.", fieldErrors: { process: "Use Title | Description on each line." } };
  if (faq.bad.length) return { ok: false, error: "Each FAQ needs the form: Question | Answer.", fieldErrors: { faqs: "Use Question | Answer on each line." } };

  const existing = id ? await db().service.findUnique({ where: { id }, select: { status: true, publishedAt: true } }) : null;
  const user = await authorizeStatus(parsed.data.status, existing?.status === "PUBLISHED");
  const { title, slug, summary, icon, status, sortOrder, seoTitle, seoDescription, imageId } = parsed.data;
  const data = {
    title, slug, summary, icon, sortOrder, seoTitle: seoTitle ?? null, seoDescription: seoDescription ?? null,
    imageId: imageId ?? null,
    overview: paragraphs(str(fd, "overview")),
    scope: lines(str(fd, "scope")),
    applications: lines(str(fd, "applications")),
    process: proc.pairs.map(([t, x]) => ({ title: t, text: x })),
    faqs: faq.pairs.map(([q, a]) => ({ q, a })),
    ...publishData(status, existing),
  };
  const relatedSlugs = all(fd, "related").filter((s) => s !== slug);
  try {
    const saved = id
      ? await db().service.update({ where: { id }, data: { ...data, related: { set: relatedSlugs.map((s) => ({ slug: s })) } } })
      : await db().service.create({ data: { ...data, related: { connect: relatedSlugs.map((s) => ({ slug: s })) } } });
    await audit(user, id ? "service.update" : "service.create", "Service", saved.id, { status });
    revalidatePublicSite();
    return { ok: true, id: saved.id, message: "Service saved." };
  } catch (e) {
    const c = conflict(e);
    if (c) return c;
    throw e;
  }
}

// ----- Industries -------------------------------------------------------------------------
export async function saveIndustry(id: string | null, fd: FormData): Promise<Result> {
  await authorize("content:write");
  const parsed = z
    .object({
      title: z.string().trim().min(2).max(120),
      slug: slugSchema,
      summary: z.string().trim().min(10).max(600),
      status: statusSchema,
      sortOrder: z.coerce.number().int().min(0).max(999).default(0),
      seoTitle: optional(70),
      seoDescription: optional(170),
    })
    .safeParse(Object.fromEntries(["title", "slug", "summary", "status", "sortOrder", "seoTitle", "seoDescription"].map((k) => [k, str(fd, k)])));
  if (!parsed.success) return failure(parsed.error);
  const faq = pairs(str(fd, "faqs"));
  if (faq.bad.length) return { ok: false, error: "Each FAQ needs the form: Question | Answer.", fieldErrors: { faqs: "Use Question | Answer on each line." } };
  const existing = id ? await db().industry.findUnique({ where: { id }, select: { status: true, publishedAt: true } }) : null;
  const user = await authorizeStatus(parsed.data.status, existing?.status === "PUBLISHED");
  const { title, slug, summary, status, sortOrder, seoTitle, seoDescription } = parsed.data;
  const serviceSlugs = all(fd, "services");
  const data = {
    title, slug, summary, sortOrder, seoTitle: seoTitle ?? null, seoDescription: seoDescription ?? null,
    needs: lines(str(fd, "needs")), challenges: lines(str(fd, "challenges")), approach: lines(str(fd, "approach")),
    faqs: faq.pairs.map(([q, a]) => ({ q, a })),
    ...publishData(status, existing),
  };
  try {
    const saved = id
      ? await db().industry.update({ where: { id }, data: { ...data, services: { set: serviceSlugs.map((s) => ({ slug: s })) } } })
      : await db().industry.create({ data: { ...data, services: { connect: serviceSlugs.map((s) => ({ slug: s })) } } });
    await audit(user, id ? "industry.update" : "industry.create", "Industry", saved.id, { status });
    revalidatePublicSite();
    return { ok: true, id: saved.id, message: "Industry saved." };
  } catch (e) {
    const c = conflict(e);
    if (c) return c;
    throw e;
  }
}

// ----- Projects ---------------------------------------------------------------------------
export async function saveProject(id: string | null, fd: FormData): Promise<Result> {
  await authorize("content:write");
  const keys = ["title", "slug", "category", "client", "location", "year", "summary", "status", "seoTitle", "seoDescription"];
  const parsed = z
    .object({
      title: z.string().trim().min(2).max(160),
      slug: slugSchema,
      category: z.enum(PROJECT_CATEGORIES),
      client: optional(120),
      location: z.string().trim().min(2).max(160),
      year: z.string().trim().regex(/^(19|20)\d{2}$/, "Enter a four-digit year."),
      summary: z.string().trim().min(10).max(400),
      status: statusSchema,
      seoTitle: optional(70),
      seoDescription: optional(170),
    })
    .safeParse(Object.fromEntries(keys.map((k) => [k, str(fd, k)])));
  if (!parsed.success) return failure(parsed.error);
  const specs = pairs(str(fd, "specifications"));
  if (specs.bad.length) return { ok: false, error: "Each specification needs the form: Label | Value.", fieldErrors: { specifications: "Use Label | Value on each line." } };
  const existing = id ? await db().project.findUnique({ where: { id }, select: { status: true, publishedAt: true } }) : null;
  const user = await authorizeStatus(parsed.data.status, existing?.status === "PUBLISHED");
  const d = parsed.data;
  if (d.status === "PUBLISHED") {
    // Only verified, complete projects may go live.
    const imageCount = id ? await db().projectImage.count({ where: { projectId: id } }) : 0;
    if (imageCount === 0) return { ok: false, error: "Add at least one verified image before publishing a project.", fieldErrors: { status: "Add a gallery image first." } };
  }
  const serviceSlugs = all(fd, "services");
  const data = {
    title: d.title, slug: d.slug, category: d.category, client: d.client ?? null, location: d.location, year: d.year,
    summary: d.summary, seoTitle: d.seoTitle ?? null, seoDescription: d.seoDescription ?? null,
    featured: str(fd, "featured") === "on",
    description: paragraphs(str(fd, "description")),
    specifications: specs.pairs.map(([label, value]) => ({ label, value })),
    ...publishData(d.status, existing),
  };
  try {
    const saved = id
      ? await db().project.update({ where: { id }, data: { ...data, services: { set: serviceSlugs.map((s) => ({ slug: s })) } } })
      : await db().project.create({ data: { ...data, services: { connect: serviceSlugs.map((s) => ({ slug: s })) } } });
    await audit(user, id ? "project.update" : "project.create", "Project", saved.id, { status: d.status });
    revalidatePublicSite();
    return { ok: true, id: saved.id, message: "Project saved." };
  } catch (e) {
    const c = conflict(e);
    if (c) return c;
    throw e;
  }
}

export async function addProjectImage(projectId: string, mediaId: string, alt: string): Promise<Result> {
  const user = await authorize("content:write");
  const altText = alt.trim().slice(0, 200);
  if (!mediaId) return { ok: false, error: "Choose an image." };
  const count = await db().projectImage.count({ where: { projectId } });
  try {
    await db().projectImage.create({ data: { projectId, mediaId, alt: altText, sortOrder: count } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2002" || e.code === "P2003"))
      return { ok: false, error: "That image is already in the gallery or no longer exists." };
    throw e;
  }
  await audit(user, "project.image_add", "Project", projectId, { mediaId });
  revalidatePublicSite();
  return { ok: true };
}

export async function removeProjectImage(imageId: string): Promise<Result> {
  const user = await authorize("content:write");
  const img = await db().projectImage.findUnique({ where: { id: imageId }, include: { project: { select: { status: true, id: true } } } });
  if (!img) return { ok: false, error: "Image not found." };
  if (img.project.status === "PUBLISHED") {
    const n = await db().projectImage.count({ where: { projectId: img.project.id } });
    if (n <= 1) return { ok: false, error: "A published project needs at least one image. Unpublish it first." };
  }
  await db().projectImage.delete({ where: { id: imageId } });
  await audit(user, "project.image_remove", "Project", img.project.id, { imageId });
  revalidatePublicSite();
  return { ok: true };
}

// ----- Articles ---------------------------------------------------------------------------
export async function saveArticle(id: string | null, fd: FormData): Promise<Result> {
  await authorize("content:write");
  const keys = ["title", "slug", "excerpt", "categoryId", "coverImageId", "status", "seoTitle", "seoDescription"];
  const parsed = z
    .object({
      title: z.string().trim().min(3).max(200),
      slug: slugSchema,
      excerpt: z.string().trim().min(10).max(400),
      categoryId: z.string().trim().min(1, "Choose a category."),
      coverImageId: optional(40),
      status: statusSchema,
      seoTitle: optional(70),
      seoDescription: optional(170),
    })
    .safeParse(Object.fromEntries(keys.map((k) => [k, str(fd, k)])));
  if (!parsed.success) return failure(parsed.error);
  const body = parseBody(str(fd, "body"));
  if (parsed.data.status === "PUBLISHED" && body.length === 0)
    return { ok: false, error: "A published article needs body content.", fieldErrors: { body: "Write the article body." } };
  const existing = id ? await db().article.findUnique({ where: { id }, select: { status: true, publishedAt: true } }) : null;
  const user = await authorizeStatus(parsed.data.status, existing?.status === "PUBLISHED");
  const d = parsed.data;
  const data = {
    title: d.title, slug: d.slug, excerpt: d.excerpt, categoryId: d.categoryId, coverImageId: d.coverImageId ?? null,
    seoTitle: d.seoTitle ?? null, seoDescription: d.seoDescription ?? null, body,
    ...publishData(d.status, existing),
  };
  try {
    const saved = id
      ? await db().article.update({ where: { id }, data })
      : await db().article.create({ data: { ...data, authorId: user.id } });
    await audit(user, id ? "article.update" : "article.create", "Article", saved.id, { status: d.status });
    revalidatePublicSite();
    return { ok: true, id: saved.id, message: "Article saved." };
  } catch (e) {
    const c = conflict(e);
    if (c) return c;
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003")
      return { ok: false, error: "That category no longer exists.", fieldErrors: { categoryId: "Choose a category." } };
    throw e;
  }
}

export async function saveCategory(name: string): Promise<Result> {
  const user = await authorize("content:write");
  const parsed = z.string().trim().min(2).max(60).safeParse(name);
  if (!parsed.success) return { ok: false, error: "Category names need 2 to 60 characters." };
  try {
    const c = await db().articleCategory.create({ data: { name: parsed.data, slug: slugify(parsed.data) } });
    await audit(user, "category.create", "ArticleCategory", c.id);
    revalidatePublicSite();
    return { ok: true, id: c.id };
  } catch (e) {
    const c = conflict(e);
    if (c) return c;
    throw e;
  }
}

export async function deleteContent(kind: "service" | "industry" | "project" | "article", id: string): Promise<Result> {
  const user = await authorize("content:publish");
  try {
    if (kind === "service") await db().service.delete({ where: { id } });
    if (kind === "industry") await db().industry.delete({ where: { id } });
    if (kind === "project") await db().project.delete({ where: { id } });
    if (kind === "article") await db().article.delete({ where: { id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") return { ok: false, error: "Not found." };
    throw e;
  }
  await audit(user, `${kind}.delete`, kind, id);
  revalidatePublicSite();
  return { ok: true };
}

// ----- Settings ---------------------------------------------------------------------------
import { SETTING_SCHEMAS, type SettingKey } from "./settings";

export async function saveSetting(key: SettingKey, fd: FormData): Promise<Result> {
  const user = await authorize("settings:write");
  let input: Record<string, unknown>;
  if (key === "homepage") {
    const why = pairs(str(fd, "why"));
    if (why.bad.length) return { ok: false, error: "Each point needs the form: Title | Description.", fieldErrors: { why: "Use Title | Description on each line." } };
    input = {
      heroHeadline: str(fd, "heroHeadline"),
      heroText: str(fd, "heroText"),
      introHeading: str(fd, "introHeading"),
      introParagraphs: paragraphs(str(fd, "introParagraphs")),
      whyHeading: str(fd, "whyHeading"),
      why: why.pairs.map(([title, text]) => ({ title, text })),
    };
  } else {
    input = Object.fromEntries([...fd.entries()].filter(([k]) => !k.startsWith("$ACTION")));
  }
  const parsed = SETTING_SCHEMAS[key].safeParse(input);
  if (!parsed.success) return failure(parsed.error);
  await db().websiteSetting.upsert({
    where: { key },
    update: { value: parsed.data as Prisma.InputJsonValue },
    create: { key, value: parsed.data as Prisma.InputJsonValue },
  });
  await audit(user, "settings.update", "WebsiteSetting", key);
  revalidatePublicSite();
  return { ok: true, message: "Settings saved." };
}

export { bodyToText };
