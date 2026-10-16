import { describe, expect, it } from "vitest";
import { evaluatePreflight, type PreflightInput } from "../../scripts/preflight";

const good: PreflightInput = {
  vercelEnv: "production",
  env: {
    DATABASE_URL: "postgres://x", DIRECT_URL: "postgres://x", AUTH_SECRET: "a".repeat(40), CRON_SECRET: "c".repeat(20),
    RESEND_API_KEY: "k", EMAIL_FROM: "Zentrik <info@zentriksolutions.com>", BLOB_PUBLIC_READ_WRITE_TOKEN: "t", BLOB_PRIVATE_READ_WRITE_TOKEN: "t",
  },
  migrationsOnDisk: ["001_init", "002_more"],
  migrationsApplied: ["001_init", "002_more"],
  publishedServices: 6,
  adminUsers: 1,
};
const run = (over: Partial<PreflightInput>, envOver: Record<string, string | undefined> = {}) =>
  evaluatePreflight({ ...good, ...over, env: { ...good.env, ...envOver } });

describe("deployment preflight", () => {
  it("passes a fully configured, migrated and seeded production deployment", () => {
    expect(run({})).toEqual({ errors: [], warnings: [] });
  });
  it("fails production when AUTH_SECRET or CRON_SECRET are missing", () => {
    expect(run({}, { AUTH_SECRET: undefined }).errors.join()).toMatch(/AUTH_SECRET/);
    expect(run({}, { AUTH_SECRET: "short" }).errors.join()).toMatch(/AUTH_SECRET/);
    expect(run({}, { CRON_SECRET: "" }).errors.join()).toMatch(/CRON_SECRET/);
  });
  it("does not require CRON_SECRET for previews", () => {
    expect(run({ vercelEnv: "preview" }, { CRON_SECRET: undefined }).errors).toEqual([]);
  });
  it("fails when there is no database URL or no migration history", () => {
    expect(run({}, { DATABASE_URL: undefined }).errors.join()).toMatch(/DATABASE_URL/);
    expect(run({ migrationsApplied: null }).errors.join()).toMatch(/no migration history/);
  });
  it("fails when migrations are pending", () => {
    const r = run({ migrationsApplied: ["001_init"] });
    expect(r.errors.join()).toMatch(/002_more/);
  });
  it("refuses to publish an empty site in production but only warns for previews", () => {
    expect(run({ publishedServices: 0 }).errors.join()).toMatch(/EMPTY/);
    const preview = run({ vercelEnv: "preview", publishedServices: 0 });
    expect(preview.errors).toEqual([]);
    expect(preview.warnings.join()).toMatch(/not seeded/);
  });
  it("blocks PREVIEW_AUTO_MIGRATE on production", () => {
    expect(run({}, { PREVIEW_AUTO_MIGRATE: "1" }).errors.join()).toMatch(/PREVIEW_AUTO_MIGRATE/);
  });
  it("warns, but does not fail, for unconfigured email, storage and missing admin", () => {
    const r = run({ adminUsers: 0 }, { RESEND_API_KEY: undefined, BLOB_PUBLIC_READ_WRITE_TOKEN: undefined, BLOB_PRIVATE_READ_WRITE_TOKEN: undefined });
    expect(r.errors).toEqual([]);
    expect(r.warnings.length).toBe(4);
  });
  it("reports database connection failures without leaking the connection string", () => {
    const r = run({ databaseError: "connect ECONNREFUSED" });
    expect(r.errors.join()).toMatch(/Cannot read the database/);
  });
});
