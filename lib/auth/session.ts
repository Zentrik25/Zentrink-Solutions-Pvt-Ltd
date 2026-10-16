import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminRole } from "@/generated/prisma/enums";
import { db } from "@/lib/server/db";
import { randomToken, sha256 } from "@/lib/server/crypto";
import { can, type Permission } from "./permissions";

export const SESSION_COOKIE = "zs_admin_session";
const SESSION_HOURS = 8;

export type SessionUser = { id: string; email: string; name: string; role: AdminRole };

export class AuthError extends Error {
  constructor(
    public code: "UNAUTHENTICATED" | "FORBIDDEN",
    message?: string,
  ) {
    super(message ?? code);
  }
}

export async function createSession(userId: string, userAgent: string | null): Promise<void> {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3600 * 1000);
  await db().adminSession.create({
    data: { tokenHash: sha256(token), userId, expiresAt, userAgent },
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db().adminSession.deleteMany({ where: { tokenHash: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

/** Resolves the signed-in administrator from the session cookie, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db().adminSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date() || !session.user.active) return null;
  const { id, email, name, role } = session.user;
  return { id, email, name, role };
}

/**
 * Authorisation for Server Actions and Route Handlers. Throws AuthError;
 * every sensitive operation calls this itself, independent of the UI.
 */
export async function authorize(permission: Permission): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("UNAUTHENTICATED");
  if (!can(user.role, permission)) throw new AuthError("FORBIDDEN");
  return user;
}

/** Authorisation for pages: redirects instead of throwing. */
export async function requirePage(permission?: Permission): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (permission && !can(user.role, permission)) redirect("/admin?denied=1");
  return user;
}

export async function purgeExpiredSessions(): Promise<number> {
  const res = await db().adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return res.count;
}
