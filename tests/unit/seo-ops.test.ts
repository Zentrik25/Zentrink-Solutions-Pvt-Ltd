import { afterEach, describe, expect, it, vi } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { absoluteUrl, isIndexable, jsonLd, pageMetadata } from "@/lib/seo";
import { classifyLink } from "@/lib/analytics";
import { redact } from "@/lib/server/log";
import { findDestructiveStatements } from "../../scripts/migration-guard";

afterEach(() => vi.unstubAllEnvs());

describe("canonical metadata", () => {
  it("always canonicalises to the apex https origin", () => {
    const m = pageMetadata({ title: "About", description: "d", path: "/about" });
    expect(m.alternates?.canonical).toBe("https://zentriksolutions.com/about");
    expect(m.openGraph).toMatchObject({ url: "https://zentriksolutions.com/about", siteName: "Zentrik Solutions (Pvt) Ltd", type: "website" });
    expect(m.twitter).toMatchObject({ card: "summary_large_image" });
    expect(absoluteUrl("/")).toBe("https://zentriksolutions.com/");
    expect(String(m.alternates?.canonical)).not.toContain("www.");
  });
  it("supports articles and noindex pages", () => {
    const a = pageMetadata({ title: "T", description: "d", path: "/insights/x", type: "article", publishedTime: "2026-01-01", section: "Solar" });
    expect(a.openGraph).toMatchObject({ type: "article", publishedTime: "2026-01-01", section: "Solar" });
    expect(pageMetadata({ title: "S", description: "d", path: "/insights", noindex: true }).robots).toEqual({ index: false, follow: true });
  });
});

describe("indexing policy", () => {
  it("indexes only the real production deployment", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isIndexable()).toBe(true);
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isIndexable()).toBe(false);
    vi.stubEnv("VERCEL_ENV", "development");
    expect(isIndexable()).toBe(false);
  });
  it("is closed by default off-Vercel and opt-in via ALLOW_INDEXING", () => {
    vi.stubEnv("VERCEL_ENV", "");
    expect(isIndexable()).toBe(false);
    vi.stubEnv("ALLOW_INDEXING", "1");
    expect(isIndexable()).toBe(true);
  });
});

describe("JSON-LD safety", () => {
  it("cannot break out of the script tag", () => {
    const out = jsonLd({ name: "</script><script>alert(1)</script>", x: " " });
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});

describe("analytics link classification (no personal data)", () => {
  it("maps conversion links to events", () => {
    expect(classifyLink("tel:+263788236186")).toEqual({ name: "phone_click", params: {} });
    expect(classifyLink("mailto:info@zentriksolutions.com")).toEqual({ name: "email_click", params: {} });
    expect(classifyLink("https://wa.me/263788236186?text=Hello")).toEqual({ name: "whatsapp_click", params: {} });
    expect(classifyLink("/request-a-quote?service=solar-energy")).toEqual({ name: "service_enquiry_click", params: { service: "solar-energy" } });
    expect(classifyLink("/about")).toBeNull();
    expect(classifyLink("https://evil.example/wa.me/")).toBeNull();
  });
  it("never puts the phone number or email in event params", () => {
    for (const href of ["tel:+263788236186", "mailto:info@zentriksolutions.com", "https://wa.me/263788236186"]) {
      expect(JSON.stringify(classifyLink(href))).not.toMatch(/263788|@zentrik/);
    }
  });
});

describe("log redaction", () => {
  it("removes emails and phone numbers", () => {
    const r = redact("failed for tendai@example.com phone +263 77 123 4567 ok");
    expect(r).not.toContain("tendai@");
    expect(r).not.toContain("123 4567");
    expect(r).toContain("[email]");
  });
});

describe("migration guard", () => {
  it("flags destructive statements", () => {
    expect(findDestructiveStatements('DROP TABLE "Enquiry";')).toContain("DROP TABLE");
    expect(findDestructiveStatements('ALTER TABLE "A" DROP COLUMN "b";')).toContain("DROP COLUMN");
    expect(findDestructiveStatements('TRUNCATE "A";')).toContain("TRUNCATE");
    expect(findDestructiveStatements('ALTER TABLE "A" ALTER COLUMN "b" TYPE integer;')).toContain("ALTER COLUMN TYPE");
    expect(findDestructiveStatements('DELETE FROM "A";')).toContain("DELETE without WHERE");
    expect(findDestructiveStatements('DELETE FROM "A" WHERE "x" = 1;')).toEqual([]);
  });
  it("ignores comments and allows additive changes", () => {
    expect(findDestructiveStatements('-- DROP TABLE x\nCREATE TABLE "B" ("id" text);\nALTER TABLE "B" ADD COLUMN "c" text;')).toEqual([]);
  });
  it("passes every migration currently in the repository", () => {
    const dir = path.join(process.cwd(), "prisma", "migrations");
    for (const d of readdirSync(dir, { withFileTypes: true }).filter((x) => x.isDirectory())) {
      expect(findDestructiveStatements(readFileSync(path.join(dir, d.name, "migration.sql"), "utf8")), d.name).toEqual([]);
    }
  });
});

describe("metadata does not override the deployment-level robots policy", () => {
  it("has no robots key for ordinary pages", () => {
    expect("robots" in pageMetadata({ title: "A", description: "d", path: "/a" })).toBe(false);
  });
});
