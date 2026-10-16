/**
 * Refuses to apply migrations that can destroy data unless explicitly allowed.
 *
 *   npx tsx scripts/migration-guard.ts            # checks every migration not yet applied
 *   ALLOW_DESTRUCTIVE_MIGRATION=1 ...             # reviewed, backed-up, deliberate override
 *
 * Run before `prisma migrate deploy` in the release workflow.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const RULES: { name: string; re: RegExp }[] = [
  { name: "DROP TABLE", re: /\bDROP\s+TABLE\b/i },
  { name: "DROP COLUMN", re: /\bDROP\s+COLUMN\b/i },
  { name: "DROP SCHEMA", re: /\bDROP\s+SCHEMA\b/i },
  { name: "DROP TYPE", re: /\bDROP\s+TYPE\b/i },
  { name: "TRUNCATE", re: /\bTRUNCATE\b/i },
  { name: "ALTER COLUMN TYPE", re: /\bALTER\s+COLUMN\b[^;]*\bTYPE\b/i },
  { name: "DELETE without WHERE", re: /\bDELETE\s+FROM\s+(?:"[^"]+"|\w+)\s*(?:;|$)/im },
  { name: "SET NOT NULL on existing column", re: /\bSET\s+NOT\s+NULL\b/i },
];

export function findDestructiveStatements(sql: string): string[] {
  // Ignore comments so documentation cannot trigger (or hide) a finding.
  const code = sql.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  return RULES.filter((r) => r.re.test(code)).map((r) => r.name);
}

async function appliedMigrations(): Promise<Set<string>> {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL or DATABASE_URL is required");
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const exists = await client.query(`SELECT to_regclass('public._prisma_migrations') AS t`);
    if (!exists.rows[0].t) return new Set();
    const res = await client.query(`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL`);
    return new Set(res.rows.map((r: { migration_name: string }) => r.migration_name));
  } finally {
    await client.end();
  }
}

async function main() {
  const dir = path.join(process.cwd(), "prisma", "migrations");
  const applied = await appliedMigrations();
  const pending = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !applied.has(d.name))
    .map((d) => d.name)
    .sort();
  if (pending.length === 0) return void console.log("No pending migrations.");

  let blocked = false;
  for (const name of pending) {
    const findings = findDestructiveStatements(readFileSync(path.join(dir, name, "migration.sql"), "utf8"));
    console.log(`${findings.length ? "!!" : "ok"}  ${name}${findings.length ? `  -> ${findings.join(", ")}` : ""}`);
    if (findings.length) blocked = true;
  }
  if (blocked && process.env.ALLOW_DESTRUCTIVE_MIGRATION !== "1") {
    console.error("\nPotentially destructive migration(s) found. Take and verify a backup, review the SQL, then re-run with ALLOW_DESTRUCTIVE_MIGRATION=1.");
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith("migration-guard.ts")) main();
