import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  CRON_SECRET: z.string().min(16).optional(),
  BLOB_PUBLIC_READ_WRITE_TOKEN: z.string().optional(),
  BLOB_PRIVATE_READ_WRITE_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  COMPANY_NOTIFICATION_EMAIL: z.string().email().default("info@zentriksolutions.com"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("https://zentriksolutions.com"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Validates environment variables on first use. Throws a clear, non-secret error. */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const names = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid or missing environment variables: ${names}`);
  }
  cached = parsed.data;
  return cached;
}

export function resetEnvCacheForTests() {
  cached = undefined;
}
