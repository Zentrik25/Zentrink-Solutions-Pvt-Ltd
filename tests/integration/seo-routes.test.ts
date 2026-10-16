import { afterEach, describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { GET as health } from "@/app/api/health/route";
import { generateMetadata as articleMetadata } from "@/app/(site)/insights/[slug]/page";
import { generateMetadata as serviceMetadata } from "@/app/(site)/services/[slug]/page";
import { db, signInAs } from "../helpers/db";
import { saveArticle, saveCategory, saveService } from "@/lib/content/admin";

afterEach(() => vi.unstubAllEnvs());

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.append(k, v);
  return f;
};

async function content() {
  await signInAs("ADMIN");
  const svc = (slug: string, status: string) =>
    saveService(null, fd({ title: slug, slug, summary: "Summary for service pages.", icon: "plug", status, sortOrder: "0", overview: "o", scope: "s", applications: "a", process: "A | b", faqs: "Q | A" }));
  await svc("live-service", "PUBLISHED");
  await svc("draft-service", "DRAFT");
  const cat = (await saveCategory("Solar")) as { id: string };
  const art = (slug: string, status: string) =>
    saveArticle(null, fd({ title: `Article ${slug}`, slug, excerpt: "An excerpt long enough.", categoryId: cat.id, status, body: "Body text.", seoTitle: "Custom SEO title", seoDescription: "Custom SEO description for the article." }));
  await art("live-article", "PUBLISHED");
  await art("draft-article", "DRAFT");
  await db().project.create({ data: { slug: "draft-project", title: "Draft", category: "Solar Energy", location: "x", year: "2026", summary: "s".repeat(12), description: [] } });
  await db().project.create({ data: { slug: "live-project", title: "Live", category: "Solar Energy", location: "x", year: "2026", summary: "s".repeat(12), description: [], status: "PUBLISHED", publishedAt: new Date() } });
  await db().industry.create({ data: { slug: "draft-industry", title: "Draft ind", summary: "s".repeat(12), needs: [], challenges: [], approach: [] } });
}

describe("sitemap", () => {
  it("contains published content only and uses the canonical apex origin", async () => {
    await content();
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain("https://zentriksolutions.com/services/live-service");
    expect(urls).toContain("https://zentriksolutions.com/insights/live-article");
    expect(urls).toContain("https://zentriksolutions.com/projects/live-project");
    for (const hidden of ["draft-service", "draft-article", "draft-project", "draft-industry"]) expect(urls.join(" ")).not.toContain(hidden);
    expect(urls.every((u) => u.startsWith("https://zentriksolutions.com/"))).toBe(true);
    expect(urls.some((u) => /\/admin|\/api\//.test(u))).toBe(false);
    expect(urls).toContain("https://zentriksolutions.com/request-a-quote");
  });
  it("picks up an item the moment it is published, and drops it when unpublished", async () => {
    await content();
    const draft = await db().service.findUniqueOrThrow({ where: { slug: "draft-service" } });
    const edit = (status: string) => saveService(draft.id, fd({ title: "draft-service", slug: "draft-service", summary: "Summary for service pages.", icon: "plug", status, sortOrder: "0", overview: "o", scope: "s", applications: "a", process: "A | b", faqs: "Q | A" }));
    await edit("PUBLISHED");
    expect((await sitemap()).map((e) => e.url)).toContain("https://zentriksolutions.com/services/draft-service");
    await edit("DRAFT");
    expect((await sitemap()).map((e) => e.url)).not.toContain("https://zentriksolutions.com/services/draft-service");
  });
});

describe("robots.txt", () => {
  it("blocks everything outside production", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(robots().rules).toEqual({ userAgent: "*", disallow: "/" });
    expect(robots().sitemap).toBeUndefined();
  });
  it("allows the site but not admin or API in production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const r = robots();
    expect(r.rules).toMatchObject({ allow: "/", disallow: ["/admin", "/api/"] });
    expect(r.sitemap).toBe("https://zentriksolutions.com/sitemap.xml");
  });
});

describe("dynamic metadata", () => {
  it("articles expose canonical, Open Graph article data and SEO overrides", async () => {
    await content();
    const m = await articleMetadata({ params: Promise.resolve({ slug: "live-article" }) });
    expect(m.alternates?.canonical).toBe("https://zentriksolutions.com/insights/live-article");
    expect(m.description).toBe("Custom SEO description for the article.");
    expect(m.openGraph).toMatchObject({ type: "article", section: "Solar" });
    expect(await articleMetadata({ params: Promise.resolve({ slug: "draft-article" }) })).toEqual({});
  });
  it("services expose canonical metadata and draft services expose nothing", async () => {
    await content();
    expect((await serviceMetadata({ params: Promise.resolve({ slug: "live-service" }) })).alternates?.canonical).toBe("https://zentriksolutions.com/services/live-service");
    expect(await serviceMetadata({ params: Promise.resolve({ slug: "draft-service" }) })).toEqual({});
  });
});

describe("health endpoint", () => {
  it("reports ok to the public without leaking configuration", async () => {
    const res = await health(new Request("http://x/api/health"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ status: "ok", database: "ok" });
    expect(body.integrations).toBeUndefined();
    expect(body.email).toBeUndefined();
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
  it("shows integration and email-backlog detail only with the secret", async () => {
    const wrong = await (await health(new Request("http://x", { headers: { authorization: "Bearer nope" } }))).json();
    expect(wrong.integrations).toBeUndefined();
    const ok = await (await health(new Request("http://x", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } }))).json();
    expect(ok.integrations).toMatchObject({ email: false, cron: true });
    expect(ok.status).toBe("degraded"); // email not configured in tests
  });
  it("flags failed email deliveries", async () => {
    await db().emailNotification.create({ data: { kind: "ENQUIRY_COMPANY", idempotencyKey: "k1", toEmail: "a@b.co", payload: {}, status: "FAILED", attempts: 3, lastError: "x" } });
    const body = await (await health(new Request("http://x", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } }))).json();
    expect(body.email).toMatchObject({ failed: 1 });
    expect(body.status).toBe("degraded");
  });
  it("returns 503 when the database is unreachable", async () => {
    const spy = vi.spyOn(db(), "$queryRaw").mockRejectedValueOnce(new Error("down"));
    const res = await health(new Request("http://x/api/health"));
    spy.mockRestore();
    expect(res.status).toBe(503);
    expect((await res.json()).status).toBe("unavailable");
  });
});

describe("health reports missing critical configuration", () => {
  it("returns 503 'misconfigured' publicly, without naming variables, when AUTH_SECRET is missing", async () => {
    vi.stubEnv("AUTH_SECRET", "");
    const res = await health(new Request("http://x/api/health"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("misconfigured");
    expect(JSON.stringify(body)).not.toContain("AUTH_SECRET");
  });
  it("names the missing variables only with the cron secret", async () => {
    vi.stubEnv("AUTH_SECRET", "short");
    const res = await health(new Request("http://x", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } }));
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.configProblems).toEqual(["AUTH_SECRET"]);
  });
  it("requires CRON_SECRET in production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("CRON_SECRET", "");
    const res = await health(new Request("http://x/api/health"));
    expect(res.status).toBe(503);
  });
});
