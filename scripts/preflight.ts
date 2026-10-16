/**
 * Pre-build safety check, run by scripts/vercel-build.sh on Vercel only.
 *
 * Turns the three ways a first deploy goes wrong silently into loud, explained build failures:
 *   1. a required secret is missing (the site would build, but forms/admin/cron would break at runtime),
 *   2. the database has not been migrated (the build would crash obscurely),
 *   3. the database has no published content (the build would succeed and publish an EMPTY site).
 *
 * Production is strict. Preview only fails on things that make it unusable.
 */
import { readdirSync } from "node:fs";
import path from "node:path";

export type PreflightInput = {
  vercelEnv: string | undefined;
  env: Record<string, string | undefined>;
  migrationsOnDisk: string[];
  migrationsApplied: string[] | null; // null = could not read (no table / unreachable)
  databaseError?: string;
  publishedServices: number | null;
  adminUsers: number | null;
};

export type PreflightResult = { errors: string[]; warnings: string[] };

export function evaluatePreflight(i: PreflightInput): PreflightResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prod = i.vercelEnv === "production";
  const scope = prod ? "Production" : "Preview";

  if (!i.env.DATABASE_URL) errors.push(`DATABASE_URL is not set for ${scope}.`);
  if (!i.env.DIRECT_URL) warnings.push(`DIRECT_URL is not set for ${scope}; migrations, seeding and backups need it.`);
  if ((i.env.AUTH_SECRET ?? "").length < 32)
    errors.push(`AUTH_SECRET is missing or shorter than 32 characters for ${scope}. Without it the enquiry form and admin sign-in fail at runtime.`);
  if (prod && (i.env.CRON_SECRET ?? "").length < 16)
    errors.push("CRON_SECRET is missing or shorter than 16 characters for Production. The email retry job and detailed health check would be rejected.");

  if (prod) {
    if (!i.env.RESEND_API_KEY || !i.env.EMAIL_FROM)
      warnings.push("RESEND_API_KEY / EMAIL_FROM not set: enquiry emails will queue but not send until configured and the domain is verified.");
    if (!i.env.BLOB_PUBLIC_READ_WRITE_TOKEN) warnings.push("BLOB_PUBLIC_READ_WRITE_TOKEN not set: image uploads will fail.");
    if (!i.env.BLOB_PRIVATE_READ_WRITE_TOKEN) warnings.push("BLOB_PRIVATE_READ_WRITE_TOKEN not set: enquiry attachments will fail.");
    if (i.env.PREVIEW_AUTO_MIGRATE === "1") errors.push("PREVIEW_AUTO_MIGRATE must never be set for Production.");
    if (i.env.ALLOW_INDEXING) warnings.push("ALLOW_INDEXING is unnecessary on Vercel (VERCEL_ENV controls indexing).");
  }

  if (i.databaseError) {
    errors.push(`Cannot read the database: ${i.databaseError}`);
  } else if (i.migrationsApplied === null) {
    errors.push("The database has no migration history. Apply migrations first (Release - database migration workflow, or `npx prisma migrate deploy` with DIRECT_URL).");
  } else {
    const missing = i.migrationsOnDisk.filter((m) => !i.migrationsApplied!.includes(m));
    if (missing.length) errors.push(`Pending migrations not applied to this database: ${missing.join(", ")}. Run the migration release step before deploying.`);
    if (i.publishedServices === 0) {
      const msg = "The database has no published services (not seeded). The site would build EMPTY. Run `npm run db:seed` against this database first.";
      if (prod) errors.push(msg);
      else warnings.push(msg);
    }
    if (prod && i.adminUsers === 0) warnings.push("No administrator exists yet. Seed one (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD) or use scripts/admin-recover.ts --create.");
  }
  return { errors, warnings };
}

async function main() {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv !== "production" && vercelEnv !== "preview") {
    console.log(`preflight: skipped (VERCEL_ENV=${vercelEnv ?? "unset"}); strict checks run on Vercel production/preview builds only.`);
    return;
  }
  const dir = path.join(process.cwd(), "prisma", "migrations");
  const migrationsOnDisk = readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();

  let migrationsApplied: string[] | null = null;
  let publishedServices: number | null = null;
  let adminUsers: number | null = null;
  let databaseError: string | undefined;
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (url) {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 15_000 });
    try {
      await client.connect();
      const t = await client.query(`SELECT to_regclass('public._prisma_migrations') AS t`);
      if (t.rows[0].t) {
        migrationsApplied = (await client.query(`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL`)).rows.map((r: { migration_name: string }) => r.migration_name);
        const svc = await client.query(`SELECT to_regclass('public."Service"') AS t`);
        if (svc.rows[0].t) {
          publishedServices = Number((await client.query(`SELECT count(*) FROM "Service" WHERE status = 'PUBLISHED'`)).rows[0].count);
          adminUsers = Number((await client.query(`SELECT count(*) FROM "AdminUser"`)).rows[0].count);
        }
      }
    } catch (e) {
      databaseError = e instanceof Error ? e.message.replace(/postgres(ql)?:\/\/\S+/gi, "[url]") : String(e);
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  const { errors, warnings } = evaluatePreflight({ vercelEnv, env: process.env, migrationsOnDisk, migrationsApplied, publishedServices, adminUsers, databaseError });
  for (const w of warnings) console.warn(`preflight WARNING: ${w}`);
  for (const e of errors) console.error(`preflight ERROR:   ${e}`);
  if (errors.length) {
    console.error(`\npreflight FAILED for ${vercelEnv}: ${errors.length} problem(s). Nothing was deployed.`);
    process.exit(1);
  }
  console.log(`preflight OK for ${vercelEnv} (${warnings.length} warning(s)).`);
}

if (process.argv[1]?.endsWith("preflight.ts")) main();
