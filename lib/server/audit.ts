import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";

export type AuditActor = { id: string; email: string } | null;

export async function audit(
  actor: AuditActor,
  action: string,
  entityType: string,
  entityId?: string | null,
  metadata?: Prisma.InputJsonValue,
  client: Pick<ReturnType<typeof db>, "auditLog"> = db(),
): Promise<void> {
  try {
    await client.auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        actorEmail: actor?.email ?? null,
        action,
        entityType,
        entityId: entityId ?? null,
        metadata: metadata ?? undefined,
      },
    });
  } catch (err) {
    // Audit failure must never break the business operation, but is never silent.
    console.error("audit log write failed", { action, entityType, err: String(err) });
  }
}
