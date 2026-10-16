import { NextResponse } from "next/server";
import { env } from "@/lib/server/env";
import { safeEqual } from "@/lib/server/crypto";
import { processNotifications } from "@/lib/notifications/processor";
import { clearExpiredRateLimits } from "@/lib/server/rate-limit";
import { purgeExpiredSessions } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Vercel Cron: retries unsent notifications and prunes expired rows. */
export async function GET(request: Request) {
  const secret = env().CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(header, `Bearer ${secret}`))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const summary = await processNotifications({ limit: 25 });
  const [limits, sessions] = await Promise.all([clearExpiredRateLimits(), purgeExpiredSessions()]);
  return NextResponse.json({ notifications: summary, prunedRateLimits: limits, prunedSessions: sessions });
}
