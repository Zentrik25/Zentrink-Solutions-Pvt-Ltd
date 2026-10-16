import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { getSetting } from "@/lib/content/settings";
import { buildQuotationPdf } from "@/lib/quotation/pdf";
import { loadQuotationForPdf } from "@/lib/quotation/service";
import { formatMoney } from "@/lib/quotation/math";
import { emailProvider, type OutgoingEmail } from "./provider";
import { clientAcknowledgementEmail, companyEnquiryEmail, quotationEmail, type EnquiryEmailData } from "./templates";

export const MAX_ATTEMPTS = 6;
const STALE_SENDING_MS = 5 * 60_000;

type Claimed = { id: string }[];

/**
 * Claims due notifications with FOR UPDATE SKIP LOCKED so concurrent invocations
 * (request-triggered and cron) never process the same row twice.
 */
async function claim(limit: number, onlyIds?: string[]): Promise<string[]> {
  const stale = new Date(Date.now() - STALE_SENDING_MS);
  const rows = await db().$queryRaw<Claimed>`
    UPDATE "EmailNotification" SET "status" = 'SENDING', "attempts" = "attempts" + 1, "updatedAt" = now()
    WHERE "id" IN (
      SELECT "id" FROM "EmailNotification"
      WHERE (
        ("status" IN ('PENDING','FAILED') AND "nextAttemptAt" <= now())
        OR ("status" = 'SENDING' AND "updatedAt" < ${stale})
      )
      AND "attempts" < ${MAX_ATTEMPTS}
      ${onlyIds && onlyIds.length > 0 ? Prisma.sql`AND "id" = ANY(${onlyIds})` : Prisma.empty}
      ORDER BY "nextAttemptAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING "id"
  `;
  return rows.map((r) => r.id);
}

async function enquiryData(enquiryId: string): Promise<EnquiryEmailData | null> {
  const e = await db().enquiry.findUnique({ where: { id: enquiryId }, include: { _count: { select: { attachments: true } } } });
  if (!e) return null;
  return {
    reference: e.reference,
    name: e.name,
    company: e.company,
    email: e.email,
    phone: e.phone,
    serviceLabel: e.serviceLabel,
    location: e.location,
    description: e.description,
    budgetRange: e.budgetRange,
    preferredStart: e.preferredStart,
    attachmentCount: e._count.attachments,
  };
}

async function buildEmail(n: {
  id: string;
  kind: string;
  toEmail: string;
  idempotencyKey: string;
  enquiryId: string | null;
  quotationId: string | null;
}): Promise<OutgoingEmail> {
  const contact = await getSetting("contact");
  if (n.kind === "ENQUIRY_COMPANY") {
    const data = n.enquiryId ? await enquiryData(n.enquiryId) : null;
    if (!data) throw new PermanentError("Enquiry no longer exists");
    const adminUrl = `${env().NEXT_PUBLIC_SITE_URL}/admin/enquiries/${n.enquiryId}`;
    const mail = companyEnquiryEmail(data, adminUrl);
    return { ...mail, to: contact.notificationEmail || env().COMPANY_NOTIFICATION_EMAIL, replyTo: data.email, idempotencyKey: n.idempotencyKey };
  }
  if (n.kind === "ENQUIRY_ACKNOWLEDGEMENT") {
    const data = n.enquiryId ? await enquiryData(n.enquiryId) : null;
    if (!data) throw new PermanentError("Enquiry no longer exists");
    const mail = clientAcknowledgementEmail(data, contact.phone, contact.email);
    return { ...mail, to: n.toEmail, replyTo: contact.email, idempotencyKey: n.idempotencyKey };
  }
  if (n.kind === "QUOTATION_CLIENT") {
    const q = n.quotationId ? await loadQuotationForPdf(n.quotationId) : null;
    if (!q) throw new PermanentError("Quotation no longer exists");
    const pdf = await buildQuotationPdf(q);
    const mail = quotationEmail(
      {
        reference: q.reference,
        clientName: q.clientName,
        projectTitle: q.projectTitle,
        total: formatMoney(q.total),
        validUntil: q.validUntil.toISOString().slice(0, 10),
      },
      contact.email,
    );
    return {
      ...mail,
      to: n.toEmail,
      replyTo: contact.email,
      attachments: [{ filename: `${q.reference}.pdf`, content: Buffer.from(pdf) }],
      idempotencyKey: n.idempotencyKey,
    };
  }
  throw new PermanentError(`Unknown notification kind ${n.kind}`);
}

class PermanentError extends Error {}

function backoffMs(attempts: number): number {
  return Math.min(6 * 3600_000, 2 ** attempts * 60_000); // 2m, 4m, 8m ... capped at 6h
}

export type ProcessSummary = { claimed: number; sent: number; failed: number; deferred: number };

export async function processNotifications(opts: { limit?: number; ids?: string[] } = {}): Promise<ProcessSummary> {
  const ids = await claim(opts.limit ?? 20, opts.ids);
  const summary: ProcessSummary = { claimed: ids.length, sent: 0, failed: 0, deferred: 0 };

  for (const id of ids) {
    const n = await db().emailNotification.findUnique({ where: { id } });
    if (!n) continue;
    try {
      const email = await buildEmail(n);
      const res = await emailProvider().send(email);
      if (res.ok) {
        await db().emailNotification.update({
          where: { id },
          data: { status: "SENT", sentAt: new Date(), providerMessageId: res.messageId, lastError: null },
        });
        summary.sent++;
      } else if (res.notConfigured) {
        // Not the notification's fault: keep it pending and do not burn an attempt.
        await db().emailNotification.update({
          where: { id },
          data: { status: "PENDING", attempts: { decrement: 1 }, nextAttemptAt: new Date(Date.now() + 15 * 60_000), lastError: res.error },
        });
        summary.deferred++;
        console.error("email provider not configured; notification deferred", { id });
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      const permanent = err instanceof PermanentError;
      const message = String(err instanceof Error ? err.message : err).slice(0, 500);
      await db().emailNotification.update({
        where: { id },
        data: {
          status: "FAILED",
          lastError: message,
          attempts: permanent ? MAX_ATTEMPTS : undefined,
          nextAttemptAt: new Date(Date.now() + backoffMs(n.attempts)),
        },
      });
      summary.failed++;
      console.error("email notification failed", { id, kind: n.kind, attempts: n.attempts, error: message });
    }
  }
  return summary;
}
