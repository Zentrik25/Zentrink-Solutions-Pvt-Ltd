import { vi } from "vitest";

const url = process.env.TEST_DATABASE_URL ?? "postgresql://postgres@localhost:5433/zentrik_test?sslmode=disable";
process.env.DATABASE_URL = url;
process.env.DIRECT_URL = url;
process.env.AUTH_SECRET = "test-secret-0123456789abcdef0123456789abcdef";
process.env.CRON_SECRET = "test-cron-secret-0123456789";
process.env.NEXT_PUBLIC_SITE_URL = "https://zentriksolutions.com";
delete process.env.RESEND_API_KEY;
(process.env as Record<string, string>).NODE_ENV = "test";

// ---- Minimal request-scope mocks for Next.js server APIs ----
export const cookieJar = new Map<string, string>();
export const requestHeaders = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    set: (name: string, value: string) => void cookieJar.set(name, value),
    delete: (name: string) => void cookieJar.delete(name),
  }),
  headers: async () => ({ get: (name: string) => requestHeaders.get(name.toLowerCase()) ?? null }),
}));

export const revalidated: string[] = [];
vi.mock("next/cache", () => ({
  revalidatePath: (p: string) => void revalidated.push(p),
}));

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`NEXT_REDIRECT:${to}`);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
