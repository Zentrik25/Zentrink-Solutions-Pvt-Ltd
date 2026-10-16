import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { AuthError, authorize, getSessionUser } from "./session";
import { hashPassword, passwordProblem, verifyPassword } from "./password";
import type { Result } from "@/lib/content/admin";

const roleSchema = z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR", "SALES"]);

export async function listUsers() {
  await authorize("users:manage");
  return db().adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, active: true, lastLoginAt: true },
  });
}

export async function createUser(input: { email: string; name: string; role: string; password: string }): Promise<Result> {
  const actor = await authorize("users:manage");
  const parsed = z
    .object({ email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email.")), name: z.string().trim().min(2).max(80), role: roleSchema })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]!.message };
  const problem = passwordProblem(input.password);
  if (problem) return { ok: false, error: problem };
  try {
    const u = await db().adminUser.create({
      data: { ...parsed.data, passwordHash: await hashPassword(input.password) },
    });
    await audit(actor, "user.create", "AdminUser", u.id, { role: parsed.data.role });
    return { ok: true, id: u.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { ok: false, error: "That email is already registered." };
    throw e;
  }
}

async function remainingSuperAdmins(excludeId: string): Promise<number> {
  return db().adminUser.count({ where: { role: "SUPER_ADMIN", active: true, id: { not: excludeId } } });
}

export async function updateUser(id: string, input: { role?: string; active?: boolean }): Promise<Result> {
  const actor = await authorize("users:manage");
  const target = await db().adminUser.findUnique({ where: { id } });
  if (!target) return { ok: false, error: "User not found." };
  const role = input.role ? roleSchema.safeParse(input.role) : null;
  if (role && !role.success) return { ok: false, error: "Unknown role." };
  if (id === actor.id && input.active === false) return { ok: false, error: "You cannot deactivate your own account." };
  const losesSuper = target.role === "SUPER_ADMIN" && ((role?.success && role.data !== "SUPER_ADMIN") || input.active === false);
  if (losesSuper && (await remainingSuperAdmins(id)) === 0)
    return { ok: false, error: "At least one active super administrator is required." };
  await db().$transaction(async (tx) => {
    await tx.adminUser.update({ where: { id }, data: { role: role?.success ? role.data : undefined, active: input.active } });
    if (input.active === false || (role?.success && role.data !== target.role)) await tx.adminSession.deleteMany({ where: { userId: id } });
  });
  await audit(actor, "user.update", "AdminUser", id, { role: input.role ?? null, active: input.active ?? null });
  return { ok: true, id };
}

export async function resetUserPassword(id: string, password: string): Promise<Result> {
  const actor = await authorize("users:manage");
  const problem = passwordProblem(password);
  if (problem) return { ok: false, error: problem };
  const hash = await hashPassword(password);
  const res = await db().adminUser.updateMany({ where: { id }, data: { passwordHash: hash, failedLogins: 0, lockedUntil: null } });
  if (res.count === 0) return { ok: false, error: "User not found." };
  await db().adminSession.deleteMany({ where: { userId: id } });
  await audit(actor, "user.password_reset", "AdminUser", id);
  return { ok: true, id };
}

/** Any signed-in administrator may change their own password. */
export async function changeOwnPassword(current: string, next: string): Promise<Result> {
  const actor = await getSessionUser();
  if (!actor) throw new AuthError("UNAUTHENTICATED");
  const user = await db().adminUser.findUnique({ where: { id: actor.id } });
  if (!user || !(await verifyPassword(current, user.passwordHash))) return { ok: false, error: "Current password is incorrect." };
  const problem = passwordProblem(next);
  if (problem) return { ok: false, error: problem };
  await db().adminUser.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
  await audit(actor, "user.password_change", "AdminUser", user.id);
  return { ok: true };
}
