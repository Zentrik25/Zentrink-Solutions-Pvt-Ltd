import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { safeEqual } from "@/lib/server/crypto";
import { env } from "@/lib/server/env";
import { log } from "@/lib/server/log";
import { configProblems } from "@/lib/server/config";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * GET /api/health
 *   Public: liveness, database connectivity and whether critical secrets are configured
 *   ("misconfigured" with HTTP 503 if not; variable names are never shown publicly).
 *   With `Authorization: Bearer $CRON_SECRET`: also reports integration configuration
 *   and email backlog so uptime monitors can alert on degraded delivery.
 */
export async function GET(request: Request) {
  const started = Date.now();
  let database = false;
  try {
    await db().$queryRaw`SELECT 1`;
    database = true;
  } catch (err) {
    log("error", "health.database_unreachable", {}, err);
  }

  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const detailed = Boolean(secret) && safeEqual(auth, `Bearer ${secret}`);

  const problems = configProblems();
  const body: Record<string, unknown> = {
    status: !database ? "unavailable" : problems.length ? "misconfigured" : "ok",
    database: database ? "ok" : "error",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    latencyMs: Date.now() - started,
  };

  if (detailed) body.configProblems = problems;

  if (detailed && database) {
    const e = env();
    const [pending, failed, oldest] = await Promise.all([
      db().emailNotification.count({ where: { status: { in: ["PENDING", "SENDING"] } } }),
      db().emailNotification.count({ where: { status: "FAILED" } }),
      db().emailNotification.findFirst({ where: { status: { in: ["PENDING", "FAILED"] } }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    ]);
    const backlogMinutes = oldest ? Math.round((Date.now() - oldest.createdAt.getTime()) / 60_000) : 0;
    const integrations = {
      email: Boolean(e.RESEND_API_KEY && e.EMAIL_FROM),
      storagePublic: Boolean(e.BLOB_PUBLIC_READ_WRITE_TOKEN),
      storagePrivate: Boolean(e.BLOB_PRIVATE_READ_WRITE_TOKEN),
      cron: Boolean(e.CRON_SECRET),
      analytics: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
    };
    // Degraded when mail is stuck for over 30 minutes or any send has permanently failed.
    const degraded = failed > 0 || backlogMinutes > 30 || !integrations.email;
    Object.assign(body, {
      status: problems.length ? "misconfigured" : degraded ? "degraded" : "ok",
      email: { pending, failed, oldestUndeliveredMinutes: backlogMinutes },
      integrations,
    });
  }

  return NextResponse.json(body, { status: database && problems.length === 0 ? 200 : 503, headers: NO_STORE });
}
