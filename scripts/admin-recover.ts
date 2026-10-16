/**
 * Administrator access recovery (run from a trusted machine with production DATABASE_URL).
 *
 *   ADMIN_NEW_PASSWORD='...' npx tsx scripts/admin-recover.ts you@example.com            # reset password
 *   ADMIN_NEW_PASSWORD='...' npx tsx scripts/admin-recover.ts you@example.com --create "Full Name"   # create super admin
 *
 * The password is read from the environment (never argv, so it stays out of shell history
 * and process lists). All of the account's sessions are revoked and the action is audit-logged.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { hashPassword, passwordProblem } from "../lib/auth/password";

async function main() {
  const [emailArg, flag, nameArg] = process.argv.slice(2);
  const email = emailArg?.trim().toLowerCase();
  const password = process.env.ADMIN_NEW_PASSWORD;
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!email || !password || !url) {
    console.error("Usage: ADMIN_NEW_PASSWORD='...' npx tsx scripts/admin-recover.ts <email> [--create \"Full Name\"]");
    process.exit(2);
  }
  const problem = passwordProblem(password);
  if (problem) {
    console.error(`Password rejected: ${problem}`);
    process.exit(2);
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    const passwordHash = await hashPassword(password);
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      await prisma.$transaction([
        prisma.adminUser.update({
          where: { id: existing.id },
          data: { passwordHash, active: true, failedLogins: 0, lockedUntil: null },
        }),
        prisma.adminSession.deleteMany({ where: { userId: existing.id } }),
        prisma.auditLog.create({ data: { actorEmail: "recovery-script", action: "admin.recovery_reset", entityType: "AdminUser", entityId: existing.id } }),
      ]);
      console.log(`Password reset and sessions revoked for ${email}.`);
    } else if (flag === "--create") {
      const user = await prisma.adminUser.create({ data: { email, name: nameArg ?? "Administrator", passwordHash, role: "SUPER_ADMIN" } });
      await prisma.auditLog.create({ data: { actorEmail: "recovery-script", action: "admin.recovery_create", entityType: "AdminUser", entityId: user.id } });
      console.log(`Created super administrator ${email}.`);
    } else {
      console.error(`No account for ${email}. Re-run with --create "Full Name" to create one.`);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
