import { db } from "@/lib/server/db";
import { hashIp } from "@/lib/server/crypto";
import { audit } from "@/lib/server/audit";
import { rateLimit } from "@/lib/server/rate-limit";
import { verifyPassword } from "./password";

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

// Verified against when the account does not exist, so timing does not reveal valid emails.
const DUMMY_HASH =
  "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(64).toString("base64");

export type LoginResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

const GENERIC = "Incorrect email or password.";

export async function attemptLogin(
  emailRaw: string,
  password: string,
  ip: string | null,
): Promise<LoginResult> {
  const email = emailRaw.trim().toLowerCase();

  const ipLimit = await rateLimit(`login:ip:${hashIp(ip) ?? "unknown"}`, 20, 15 * 60);
  const emailLimit = await rateLimit(`login:email:${email}`, 10, 15 * 60);
  if (!ipLimit.allowed || !emailLimit.allowed)
    return { ok: false, error: "Too many attempts. Please wait and try again." };

  const user = await db().adminUser.findUnique({ where: { email } });

  if (user?.lockedUntil && user.lockedUntil > new Date())
    return { ok: false, error: "Account temporarily locked. Try again later." };

  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.active || !valid) {
    if (user) {
      const failed = user.failedLogins + 1;
      await db().adminUser.update({
        where: { id: user.id },
        data: {
          failedLogins: failed >= MAX_FAILED ? 0 : failed,
          lockedUntil: failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
        },
      });
    }
    await audit(null, "auth.login_failed", "AdminUser", user?.id ?? null, { email });
    return { ok: false, error: GENERIC };
  }

  await db().adminUser.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await audit({ id: user.id, email: user.email }, "auth.login", "AdminUser", user.id);
  return { ok: true, userId: user.id };
}
