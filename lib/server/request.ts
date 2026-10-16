import { headers } from "next/headers";

export async function clientIp(): Promise<string | null> {
  const h = await headers();
  // On Vercel these headers are set by the platform and cannot be spoofed by clients.
  const vercel = h.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0]!.trim();
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = h.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0]!.trim() : null;
}

export async function userAgent(): Promise<string | null> {
  return (await headers()).get("user-agent")?.slice(0, 300) ?? null;
}
