/**
 * Runtime configuration self-check. A missing AUTH_SECRET does not stop the site from rendering,
 * but it silently breaks the enquiry form, admin sign-in and the cron job, so the health endpoint
 * must report it. Returns variable NAMES only (never values).
 */
export function configProblems(env: Record<string, string | undefined> = process.env): string[] {
  const problems: string[] = [];
  if (!env.DATABASE_URL) problems.push("DATABASE_URL");
  if ((env.AUTH_SECRET ?? "").length < 32) problems.push("AUTH_SECRET");
  if (env.VERCEL_ENV === "production" && (env.CRON_SECRET ?? "").length < 16) problems.push("CRON_SECRET");
  return problems;
}
