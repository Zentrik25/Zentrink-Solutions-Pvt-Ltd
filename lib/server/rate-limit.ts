import { db } from "./db";

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };

/**
 * Fixed-window rate limiter stored in PostgreSQL, so limits hold across
 * serverless instances. A single atomic upsert avoids races.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const rows = await db().$queryRaw<{ count: number; ttl: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart", "expiresAt")
    VALUES (${key}, 1, now(), now() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."expiresAt" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimit"."expiresAt" <= now() THEN now() ELSE "RateLimit"."windowStart" END,
      "expiresAt" = CASE WHEN "RateLimit"."expiresAt" <= now()
                         THEN now() + make_interval(secs => ${windowSeconds})
                         ELSE "RateLimit"."expiresAt" END
    RETURNING "count", CEIL(EXTRACT(EPOCH FROM ("expiresAt" - now())))::int AS ttl
  `;
  const { count, ttl } = rows[0]!;
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), retryAfterSeconds: Math.max(1, ttl) };
}

export async function clearExpiredRateLimits(): Promise<number> {
  const res = await db().rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return res.count;
}
