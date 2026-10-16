import { hmac, safeEqual } from "@/lib/server/crypto";

const MIN_AGE_MS = 3_000;
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

/** Signed render timestamp embedded in the form; rejects instant bot posts and replayed old forms. */
export function issueFormToken(now = Date.now()): string {
  const ts = String(now);
  return `${ts}.${hmac(`form:${ts}`)}`;
}

export function verifyFormToken(token: string | null | undefined, now = Date.now()): boolean {
  if (!token) return false;
  const [ts, sig] = token.split(".");
  if (!ts || !sig || !/^\d+$/.test(ts)) return false;
  if (!safeEqual(sig, hmac(`form:${ts}`))) return false;
  const age = now - Number(ts);
  return age >= MIN_AGE_MS && age <= MAX_AGE_MS;
}
