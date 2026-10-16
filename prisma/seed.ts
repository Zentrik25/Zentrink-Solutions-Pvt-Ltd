import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { SERVICES } from "../lib/services";
import { INDUSTRIES } from "../lib/industries";
import { ARTICLES, ARTICLE_CATEGORIES } from "../lib/articles";
import { SETTING_DEFAULTS } from "../lib/content/settings";
import { hashPassword, passwordProblem } from "../lib/auth/password";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  // Administrator
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    const problem = passwordProblem(password);
    if (problem) throw new Error(`SEED_ADMIN_PASSWORD rejected: ${problem}`);
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (!existing) {
      await prisma.adminUser.create({
        data: { email, name: "Administrator", passwordHash: await hashPassword(password), role: "SUPER_ADMIN" },
      });
      console.log(`Created super admin ${email}`);
    } else console.log(`Admin ${email} already exists; left unchanged`);
  } else console.log("SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD not set; no admin created");

  // Settings (never overwrite edited values)
  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    await prisma.websiteSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  // Media for the bundled photography
  const mediaByUrl = new Map<string, string>();
  for (const s of SERVICES) {
    const key = `seed${s.image.src}`;
    const m = await prisma.media.upsert({
      where: { key },
      update: {},
      create: { key, url: s.image.src, filename: s.image.src.split("/").pop()!, mimeType: "image/jpeg", size: 0, width: s.image.width, height: s.image.height, alt: s.image.alt },
    });
    mediaByUrl.set(s.slug, m.id);
  }

  const now = new Date();
  // Services
  for (const [i, s] of SERVICES.entries()) {
    if (await prisma.service.findUnique({ where: { slug: s.slug } })) continue;
    await prisma.service.create({
      data: {
        slug: s.slug, title: s.title, summary: s.summary, icon: s.icon, overview: s.overview,
        scope: s.scope, applications: s.applications, process: s.process, faqs: s.faqs,
        imageId: mediaByUrl.get(s.slug), status: "PUBLISHED", publishedAt: now, sortOrder: i,
        seoTitle: s.seo?.title, seoDescription: s.seo?.description,
      },
    });
  }
  for (const s of SERVICES) {
    await prisma.service.update({
      where: { slug: s.slug },
      data: { related: { connect: s.related.map((slug) => ({ slug })) } },
    }).catch(() => undefined);
  }

  // Industries
  for (const [i, ind] of INDUSTRIES.entries()) {
    if (await prisma.industry.findUnique({ where: { slug: ind.slug } })) continue;
    await prisma.industry.create({
      data: {
        slug: ind.slug, title: ind.title, summary: ind.summary, needs: ind.needs,
        challenges: ind.challenges, approach: ind.approach, faqs: ind.faqs,
        status: "PUBLISHED", publishedAt: now, sortOrder: i,
        services: { connect: ind.services.map((slug) => ({ slug })) },
      },
    });
  }

  // Articles
  const categoryIds = new Map<string, string>();
  for (const [i, name] of ARTICLE_CATEGORIES.entries()) {
    const c = await prisma.articleCategory.upsert({
      where: { slug: slugify(name) }, update: {}, create: { name, slug: slugify(name), sortOrder: i },
    });
    categoryIds.set(name, c.id);
  }
  // Short, search-friendly titles (about 60 characters) and descriptions for the launch articles.
  const ARTICLE_SEO: Record<string, [string, string]> = {
    "sizing-a-solar-pv-system-for-a-commercial-load": ["How to Size a Commercial Solar PV System", "The inputs that decide array, inverter and battery size for a commercial solar PV system: load profile, peak demand, roof area and your objective."],
    "cable-sizing-fundamentals-current-voltage-drop-fault-withstand": ["Cable Sizing: Current, Voltage Drop, Fault Withstand", "A cable must pass three separate checks: current capacity, voltage drop and fault withstand. How each is calculated and why they must be done together."],
    "why-pre-energisation-testing-matters": ["Why Pre-Energisation Electrical Testing Matters", "Inspection and testing before an installation is energised is the evidence it is safe. The core tests and what each one confirms."],
    "planned-versus-reactive-electrical-maintenance": ["Planned vs Reactive Electrical Maintenance", "Waiting for equipment to fail is costly. What planned electrical maintenance involves in industrial plants and how to prioritise it."],
    "procurement-checklist-for-distribution-boards-and-switchgear": ["Switchgear and Distribution Board Procurement Checklist", "Settle ratings, fault levels, standards and support before requesting quotations for distribution boards and switchgear."],
    "power-factor-correction-and-when-it-pays-back": ["Power Factor Correction: When Does It Pay Back?", "What power factor is, why low power factor costs money and capacity, how it is corrected, and when correction is worth the investment."],
    "hybrid-solar-design-for-supply-interruptions": ["Hybrid Solar Design for Supply Interruptions", "How hybrid solar and battery systems keep critical loads running during outages: critical-load boards, sizing, protection and commissioning."],
  };
  for (const a of ARTICLES) {
    if (await prisma.article.findUnique({ where: { slug: a.slug } })) continue;
    await prisma.article.create({
      data: {
        slug: a.slug, title: a.title, excerpt: a.excerpt, body: a.body,
        categoryId: categoryIds.get(a.category)!, status: "PUBLISHED", publishedAt: new Date(`${a.published}T08:00:00Z`),
        seoTitle: ARTICLE_SEO[a.slug]?.[0], seoDescription: ARTICLE_SEO[a.slug]?.[1],
      },
    });
  }
  console.log("Seed complete");
}

main().finally(() => prisma.$disconnect());
