/**
 * Structured JSON logging for Vercel Logs / log drains.
 * Anything that might carry personal data (emails, phone numbers, long free text)
 * is redacted before it is written.
 */
type Level = "info" | "warn" | "error";

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /\+?\d[\d\s().-]{7,}\d/g;

export function redact(text: string): string {
  return text.replace(EMAIL, "[email]").replace(PHONE, "[number]").slice(0, 500);
}

function errorInfo(err: unknown): { name: string; code?: string; message: string } {
  if (err instanceof Error) {
    const code = (err as { code?: unknown }).code;
    return { name: err.name, code: typeof code === "string" ? code : undefined, message: redact(err.message) };
  }
  return { name: "NonError", message: redact(String(err)) };
}

export function log(level: Level, event: string, fields: Record<string, unknown> = {}, err?: unknown): void {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) safe[k] = typeof v === "string" ? redact(v) : v;
  const line = JSON.stringify({
    level,
    event,
    time: new Date().toISOString(),
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
    ...safe,
    ...(err !== undefined ? { error: errorInfo(err) } : {}),
  });
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
}
