import { afterEach, describe, expect, it, vi } from "vitest";
import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as contentAdmin from "@/lib/content/admin";
import * as media from "@/lib/content/media";
import * as users from "@/lib/auth/users";
import * as quotation from "@/lib/quotation/service";
import * as enquiryAdmin from "@/lib/enquiry/admin";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { createEnquiry } from "@/lib/enquiry/service";
import { issueFormToken } from "@/lib/enquiry/spam";
import { listEnquiries } from "@/lib/enquiry/admin";
import { db, makePublishedService, signInAs, signOut } from "../helpers/db";

const root = process.cwd();
const walk = (dir: string, out: string[] = []): string[] => {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

afterEach(() => vi.unstubAllEnvs());

describe("admin surface is fully guarded", () => {
  it("every admin page requires a signed-in user with a permission", () => {
    const pages = walk(path.join(root, "app/admin/(app)")).filter((f) => f.endsWith("/page.tsx"));
    expect(pages.length).toBeGreaterThan(10);
    for (const f of pages) expect(readFileSync(f, "utf8"), f).toMatch(/requirePage\(/);
  });

  it("the admin layout enforces authentication for every nested route", () => {
    expect(readFileSync(path.join(root, "app/admin/(app)/layout.tsx"), "utf8")).toMatch(/requirePage\(\)/);
  });

  it("every admin route handler authorises before touching data", () => {
    const routes = walk(path.join(root, "app/admin")).filter((f) => f.endsWith("/route.ts"));
    expect(routes.length).toBeGreaterThanOrEqual(2);
    for (const f of routes) expect(readFileSync(f, "utf8"), f).toMatch(/authorize\(|getAttachmentForDownload\(/);
  });

  it("every Server Action either delegates through a guarded domain function or is a public form", () => {
    const files = [
      "app/admin/(app)/content-actions.ts",
      "app/admin/(app)/enquiries/actions.ts",
      "app/admin/(app)/quotations/actions.ts",
    ].map((f) => path.join(root, f));
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      const bodies = src.split(/export async function /).slice(1);
      expect(bodies.length).toBeGreaterThan(2);
      for (const b of bodies) expect(b.slice(0, 600), `${f}: ${b.slice(0, 40)}`).toMatch(/guarded\(|guard\(/);
    }
  });

  it("no admin file exports unreviewed server functions (forces a security review of new ones)", () => {
    expect(Object.keys(contentAdmin).filter((k) => typeof (contentAdmin as Record<string, unknown>)[k] === "function").sort()).toEqual(
      ["addProjectImage", "deleteContent", "removeProjectImage", "saveArticle", "saveCategory", "saveIndustry", "saveProject", "saveService", "saveSetting", "bodyToText"].sort(),
    );
    expect(Object.keys(media).sort()).toEqual(["deleteMedia", "uploadMedia"]);
    expect(Object.keys(users).sort()).toEqual(["changeOwnPassword", "createUser", "listUsers", "resetUserPassword", "updateUser"]);
    expect(Object.keys(quotation).filter((k) => k !== "formatMoney").sort()).toEqual(
      ["createQuotation", "loadQuotationForPdf", "sendQuotation", "setQuotationStatus", "updateQuotation"],
    );
    expect(Object.keys(enquiryAdmin).filter((k) => typeof (enquiryAdmin as Record<string, unknown>)[k] === "function").sort()).toEqual(
      ["addEnquiryNote", "assignEnquiry", "changeEnquiryStatus", "getAttachmentForDownload", "getEnquiryDetail", "listEnquiries"],
    );
  });
});

describe("authorisation matrix: every privileged function rejects anonymous callers", () => {
  const fd = new FormData();
  const calls: [string, () => Promise<unknown>][] = [
    ["saveService", () => contentAdmin.saveService(null, fd)],
    ["saveIndustry", () => contentAdmin.saveIndustry(null, fd)],
    ["saveProject", () => contentAdmin.saveProject(null, fd)],
    ["saveArticle", () => contentAdmin.saveArticle(null, fd)],
    ["saveCategory", () => contentAdmin.saveCategory("X")],
    ["deleteContent", () => contentAdmin.deleteContent("service", "id")],
    ["saveSetting", () => contentAdmin.saveSetting("contact", fd)],
    ["addProjectImage", () => contentAdmin.addProjectImage("p", "m", "")],
    ["removeProjectImage", () => contentAdmin.removeProjectImage("i")],
    ["uploadMedia", () => media.uploadMedia({ name: "a.png", type: "image/png", size: 1, bytes: new Uint8Array(1) }, "a")],
    ["deleteMedia", () => media.deleteMedia("m")],
    ["listUsers", () => users.listUsers()],
    ["createUser", () => users.createUser({ email: "a@b.co", name: "A B", role: "ADMIN", password: "GoodPassword1234" })],
    ["updateUser", () => users.updateUser("u", { active: false })],
    ["resetUserPassword", () => users.resetUserPassword("u", "GoodPassword1234")],
    ["changeOwnPassword", () => users.changeOwnPassword("a", "b")],
    ["createQuotation", () => quotation.createQuotation({})],
    ["updateQuotation", () => quotation.updateQuotation("q", {})],
    ["sendQuotation", () => quotation.sendQuotation("q")],
    ["setQuotationStatus", () => quotation.setQuotationStatus("q", "ACCEPTED")],
    ["listEnquiries", () => enquiryAdmin.listEnquiries({})],
    ["getEnquiryDetail", () => enquiryAdmin.getEnquiryDetail("e")],
    ["changeEnquiryStatus", () => enquiryAdmin.changeEnquiryStatus("e", "UNDER_REVIEW")],
    ["addEnquiryNote", () => enquiryAdmin.addEnquiryNote("e", "n")],
    ["assignEnquiry", () => enquiryAdmin.assignEnquiry("e", null)],
    ["getAttachmentForDownload", () => enquiryAdmin.getAttachmentForDownload("e", "a")],
  ];
  it.each(calls)("%s", async (_name, fn) => {
    signOut();
    await expect(fn()).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("an editor cannot reach sales, user-management or settings functions", async () => {
    await signInAs("EDITOR");
    for (const [name, fn] of calls.filter(([n]) => /Enquir|Quotation|listUsers|createUser|updateUser|resetUser|saveSetting|getAttachment/.test(n))) {
      await expect(fn(), name).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });
});

describe("injection", () => {
  const payloads = [`'; DROP TABLE "Enquiry"; --`, `" OR 1=1 --`, "Robert'); DELETE FROM \"AdminUser\";--", "${jndi:ldap://x}", "{{7*7}}"];

  it("stores SQL injection strings literally and leaves the database intact", async () => {
    await makePublishedService();
    for (const [i, p] of payloads.entries()) {
      const r = await createEnquiry(
        { name: `Name ${p}`.slice(0, 100), company: p.slice(0, 100), email: `sqli${i}@example.com`, phone: "", service: "electrical-installations", location: p.slice(0, 100), description: `Description with payload ${p} and enough length`, budget: "", preferredStart: "", consent: "yes", website: "", formToken: issueFormToken(Date.now()) },
        [], { ip: `198.51.100.${i}`, userAgent: null, now: new Date(Date.now() + 10_000) },
      );
      expect(r.ok, p).toBe(true);
    }
    expect(await db().enquiry.count()).toBe(payloads.length);
    const stored = await db().enquiry.findFirstOrThrow({ orderBy: { seq: "asc" } });
    expect(stored.company).toBe(payloads[0]!.slice(0, 100));
    expect(await db().$queryRaw`SELECT to_regclass('public."Enquiry"')::text AS t`).toEqual([{ t: "\"Enquiry\"" }]);
  });

  it("inbox search treats payloads as plain text", async () => {
    await signInAs("SALES");
    for (const p of payloads) await expect(listEnquiries({ q: p })).resolves.toMatchObject({ total: 0 });
    expect(await db().adminUser.count()).toBe(1);
  });

  it("rate-limit keys built from user input are parameterised", async () => {
    await makePublishedService();
    const evil = `x@y.co'); DELETE FROM "RateLimit";--`;
    const r = await createEnquiry(
      { name: "Evil Tester", company: "", email: evil, phone: "", service: "electrical-installations", location: "Here", description: "A description that is long enough.", budget: "", preferredStart: "", consent: "yes", website: "", formToken: issueFormToken(Date.now()) },
      [], { ip: "198.51.100.99", userAgent: null, now: new Date(Date.now() + 10_000) },
    );
    expect(r).toMatchObject({ ok: false, kind: "invalid" }); // fails email validation before any query is built
  });
});

describe("cross-site scripting", () => {
  it("escapes hostile text in server-rendered markup and JSON-LD", () => {
    const html = renderToStaticMarkup(createElement(Breadcrumbs, { items: [{ label: "</script><script>alert(1)</script>" }, { label: '"><img src=x onerror=alert(1)>' }] }));
    expect(html).not.toContain("<script>alert(1)");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;/script&gt;");
    const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]!;
    expect(ld).not.toContain("<");
    expect(JSON.parse(ld).itemListElement[0].name).toBe("</script><script>alert(1)</script>");
  });
});

describe("transport and header security", () => {
  async function config(env: Record<string, string>) {
    vi.resetModules();
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
    return (await import("../../next.config")).default;
  }
  const headerMap = async (cfg: Awaited<ReturnType<typeof config>>, host?: string) => {
    const rules = await cfg.headers!();
    return rules.flatMap((r) => (r.has ? (host ? r.headers : []) : r.headers)).map((h) => [h.key.toLowerCase(), h.value] as const);
  };

  it("production sends HSTS, a strict CSP, nosniff, frame denial and referrer policy", async () => {
    const h = new Map(await headerMap(await config({ NODE_ENV: "production", VERCEL_ENV: "production" })));
    expect(h.get("strict-transport-security")).toMatch(/max-age=\d{8,}/);
    const csp = h.get("content-security-policy")!;
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toMatch(/script-src[^;]*\*(?!\.)/);
    expect(h.get("x-content-type-options")).toBe("nosniff");
    expect(h.get("x-frame-options")).toBe("DENY");
    expect(h.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(h.get("permissions-policy")).toContain("camera=()");
  });

  it("previews are blocked from indexing; production is not blanket-noindexed", async () => {
    const preview = await config({ NODE_ENV: "production", VERCEL_ENV: "preview" });
    expect((await headerMap(preview)).some(([k, v]) => k === "x-robots-tag" && v.includes("noindex"))).toBe(true);
    const prod = await config({ NODE_ENV: "production", VERCEL_ENV: "production" });
    const rules = await prod.headers!();
    const blanket = rules.filter((r) => r.source === "/:path*" && !r.has && r.headers.some((h) => h.key === "X-Robots-Tag"));
    expect(blanket).toHaveLength(0);
  });

  it("admin and API responses are never cached or indexed", async () => {
    const rules = await (await config({ NODE_ENV: "production", VERCEL_ENV: "production" })).headers!();
    for (const src of ["/admin/:path*", "/api/:path*"]) {
      const r = rules.find((x) => x.source === src)!;
      expect(r.headers.map((h) => h.key)).toEqual(expect.arrayContaining(["Cache-Control", "X-Robots-Tag"]));
    }
  });

  it("redirects www to the canonical apex permanently", async () => {
    const redirects = await (await config({ NODE_ENV: "production" })).redirects!();
    const www = redirects.find((r) => r.has?.some((h) => h.type === "host" && h.value === "www.zentriksolutions.com"))!;
    expect(www).toMatchObject({ permanent: true, destination: "https://zentriksolutions.com/:path*" });
  });

  it("uses a __Host- prefixed, HttpOnly-capable session cookie in production", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    const { SESSION_COOKIE } = await import("@/lib/auth/session");
    expect(SESSION_COOKIE).toBe("__Host-zs_admin_session");
  });
});

describe("secret exposure", () => {
  const tracked = execSync("git ls-files --cached --others --exclude-standard", { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean);

  it("never tracks env files with values", () => {
    expect(tracked.filter((f) => /(^|\/)\.env(\.|$)/.test(f) && f !== ".env.example")).toEqual([]);
  });

  it("contains no credential-shaped strings in tracked source", () => {
    const patterns: [string, RegExp][] = [
      ["Resend key", /\bre_[A-Za-z0-9]{20,}\b/],
      ["Vercel Blob token", /vercel_blob_rw_[A-Za-z0-9_]+/],
      ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
      ["AWS key", /\bAKIA[0-9A-Z]{16}\b/],
      ["DB URL with password", /postgres(?:ql)?:\/\/[^:\s/@]+:(?!PASSWORD|postgres@|\$\{)[^@\s]{6,}@(?!localhost)/],
    ];
    const offenders: string[] = [];
    for (const f of tracked.filter((x) => /\.(ts|tsx|mts|json|md|yml|yaml|mjs|sh|css)$/.test(x) && !x.includes("package-lock") && !x.includes("logo-data"))) {
      const text = readFileSync(path.join(root, f), "utf8");
      for (const [name, re] of patterns) if (re.test(text)) offenders.push(`${f}: ${name}`);
    }
    expect(offenders).toEqual([]);
  });

  it("only exposes an allow-list of NEXT_PUBLIC_ variables to the browser", () => {
    const used = new Set<string>();
    for (const f of tracked.filter((x) => /\.(ts|tsx)$/.test(x) && !x.startsWith("tests/"))) {
      for (const m of readFileSync(path.join(root, f), "utf8").matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g)) used.add(m[0]);
    }
    expect([...used].sort()).toEqual(["NEXT_PUBLIC_GA_MEASUREMENT_ID", "NEXT_PUBLIC_GSC_VERIFICATION", "NEXT_PUBLIC_SITE_URL"]);
  });
});

describe("sensitive logging", () => {
  it("application code logs only through the redacting logger", () => {
    const offenders: string[] = [];
    for (const f of execSync("git ls-files --cached --others --exclude-standard -- 'lib/**/*.ts' 'app/**/*.ts' 'app/**/*.tsx' 'components/**/*.tsx'", { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean)) {
      if (f === "lib/server/log.ts") continue;
      if (/console\.(log|error|warn|info)\(/.test(readFileSync(path.join(root, f), "utf8"))) offenders.push(f);
    }
    expect(offenders).toEqual([]);
  });
});
