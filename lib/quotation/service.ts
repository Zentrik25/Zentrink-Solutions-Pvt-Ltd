import { db } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { authorize, type SessionUser } from "@/lib/auth/session";
import { getSetting } from "@/lib/content/settings";
import { canTransition } from "@/lib/enquiry/workflow";
import type { EnquiryStatus, QuotationStatus } from "@/generated/prisma/enums";
import { computeTotals, formatMoney, formatQuotationReference, QuotationMathError } from "./math";
import { quotationSchema, type QuotationInput } from "./schema";
import type { PdfQuotation } from "./pdf";

export type QuotationResult<T = { id: string }> =
  | ({ ok: true } & T)
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function parse(input: unknown): { ok: true; data: QuotationInput } | { ok: false; error: string; fieldErrors: Record<string, string> } {
  const parsed = quotationSchema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };
  const fieldErrors: Record<string, string> = {};
  for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] ||= i.message;
  return { ok: false, error: "Please correct the highlighted fields.", fieldErrors };
}

async function moveEnquiry(
  tx: Pick<ReturnType<typeof db>, "enquiry" | "enquiryStatusHistory">,
  enquiryId: string,
  to: EnquiryStatus,
  actor: SessionUser,
  note: string,
) {
  const enquiry = await tx.enquiry.findUnique({ where: { id: enquiryId }, select: { status: true } });
  if (!enquiry || enquiry.status === to || !canTransition(enquiry.status, to)) return;
  await tx.enquiry.update({ where: { id: enquiryId }, data: { status: to } });
  await tx.enquiryStatusHistory.create({
    data: { enquiryId, fromStatus: enquiry.status, toStatus: to, changedById: actor.id, note },
  });
}

export async function createQuotation(rawInput: unknown): Promise<QuotationResult> {
  const actor = await authorize("quotations:write");
  const p = parse(rawInput);
  if (!p.ok) return p;
  const input = p.data;

  let totals;
  try {
    totals = computeTotals(input.items, input.taxRate);
  } catch (e) {
    if (e instanceof QuotationMathError) return { ok: false, error: e.message };
    throw e;
  }

  const created = await db().$transaction(async (tx) => {
    if (input.enquiryId) {
      const exists = await tx.enquiry.findUnique({ where: { id: input.enquiryId }, select: { id: true } });
      if (!exists) throw new Error("ENQUIRY_NOT_FOUND");
    }
    const q = await tx.quotation.create({
      data: {
        reference: `PENDING-${Math.random().toString(36).slice(2)}`,
        enquiryId: input.enquiryId ?? null,
        clientName: input.clientName,
        clientCompany: input.clientCompany || null,
        clientEmail: input.clientEmail,
        clientPhone: input.clientPhone || null,
        clientAddress: input.clientAddress || null,
        projectTitle: input.projectTitle,
        taxName: input.taxName,
        taxRate: totals.taxRate,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        validUntil: new Date(`${input.validUntil}T00:00:00Z`),
        terms: input.terms,
        notes: input.notes || null,
        createdById: actor.id,
        items: {
          create: totals.items.map((it, i) => ({
            position: i + 1,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            lineTotal: it.lineTotal,
          })),
        },
      },
    });
    await tx.quotation.update({ where: { id: q.id }, data: { reference: formatQuotationReference(q.seq) } });
    if (input.enquiryId) await moveEnquiry(tx, input.enquiryId, "QUOTATION_PREPARED", actor, "Quotation created");
    return q;
  }).catch((e: unknown) => {
    if (e instanceof Error && e.message === "ENQUIRY_NOT_FOUND") return null;
    throw e;
  });
  if (!created) return { ok: false, error: "The linked enquiry no longer exists." };

  await audit(actor, "quotation.create", "Quotation", created.id, { total: totals.total });
  return { ok: true, id: created.id };
}

export async function updateQuotation(id: string, rawInput: unknown): Promise<QuotationResult> {
  const actor = await authorize("quotations:write");
  const existing = await db().quotation.findUnique({ where: { id }, select: { status: true } });
  if (!existing) return { ok: false, error: "Quotation not found." };
  if (existing.status !== "DRAFT") return { ok: false, error: "Only draft quotations can be edited." };

  const p = parse(rawInput);
  if (!p.ok) return p;
  const input = p.data;
  let totals;
  try {
    totals = computeTotals(input.items, input.taxRate);
  } catch (e) {
    if (e instanceof QuotationMathError) return { ok: false, error: e.message };
    throw e;
  }

  await db().$transaction(async (tx) => {
    await tx.quotationItem.deleteMany({ where: { quotationId: id } });
    await tx.quotation.update({
      where: { id },
      data: {
        clientName: input.clientName,
        clientCompany: input.clientCompany || null,
        clientEmail: input.clientEmail,
        clientPhone: input.clientPhone || null,
        clientAddress: input.clientAddress || null,
        projectTitle: input.projectTitle,
        taxName: input.taxName,
        taxRate: totals.taxRate,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        validUntil: new Date(`${input.validUntil}T00:00:00Z`),
        terms: input.terms,
        notes: input.notes || null,
        items: {
          create: totals.items.map((it, i) => ({
            position: i + 1,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            lineTotal: it.lineTotal,
          })),
        },
      },
    });
  });
  await audit(actor, "quotation.update", "Quotation", id, { total: totals.total });
  return { ok: true, id };
}

const STATUS_CHANGES: Record<QuotationStatus, QuotationStatus[]> = {
  DRAFT: [],
  SENT: ["ACCEPTED", "REJECTED", "EXPIRED"],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
};

export async function setQuotationStatus(id: string, to: QuotationStatus): Promise<QuotationResult> {
  const actor = await authorize("quotations:write");
  const q = await db().quotation.findUnique({ where: { id }, select: { status: true, enquiryId: true } });
  if (!q) return { ok: false, error: "Quotation not found." };
  if (!STATUS_CHANGES[q.status].includes(to))
    return { ok: false, error: `A ${q.status.toLowerCase()} quotation cannot become ${to.toLowerCase()}.` };
  await db().$transaction(async (tx) => {
    await tx.quotation.update({ where: { id }, data: { status: to } });
    if (q.enquiryId && to === "ACCEPTED") await moveEnquiry(tx, q.enquiryId, "WON", actor, "Quotation accepted");
    if (q.enquiryId && to === "REJECTED") await moveEnquiry(tx, q.enquiryId, "LOST", actor, "Quotation rejected");
  });
  await audit(actor, "quotation.status", "Quotation", id, { to });
  return { ok: true, id };
}

/** Queues the client email (with PDF) and marks the quotation sent. Requires quotations:send. */
export async function sendQuotation(id: string): Promise<QuotationResult<{ id: string; notificationId: string }>> {
  const actor = await authorize("quotations:send");
  const q = await db().quotation.findUnique({ where: { id }, include: { items: true } });
  if (!q) return { ok: false, error: "Quotation not found." };
  if (q.status !== "DRAFT" && q.status !== "SENT") return { ok: false, error: "Only draft or sent quotations can be (re)sent." };
  if (q.items.length === 0) return { ok: false, error: "The quotation has no items." };

  const notification = await db().$transaction(async (tx) => {
    const sendNo = await tx.emailNotification.count({ where: { quotationId: id, kind: "QUOTATION_CLIENT" } });
    const n = await tx.emailNotification.create({
      data: {
        kind: "QUOTATION_CLIENT",
        idempotencyKey: `quotation:${id}:send:${sendNo + 1}`,
        toEmail: q.clientEmail,
        payload: { quotationId: id },
        quotationId: id,
        enquiryId: q.enquiryId,
      },
    });
    await tx.quotation.update({ where: { id }, data: { status: "SENT", sentAt: q.sentAt ?? new Date() } });
    if (q.enquiryId) await moveEnquiry(tx, q.enquiryId, "QUOTATION_SENT", actor, "Quotation sent to client");
    return n;
  });
  await audit(actor, "quotation.send", "Quotation", id, { to: q.clientEmail });
  return { ok: true, id, notificationId: notification.id };
}

/** Loads a quotation shaped for the PDF renderer. Callers MUST authorise first. */
export async function loadQuotationForPdf(id: string): Promise<PdfQuotation | null> {
  const q = await db().quotation.findUnique({ where: { id }, include: { items: { orderBy: { position: "asc" } } } });
  if (!q) return null;
  const [contact, quotationSettings] = await Promise.all([getSetting("contact"), getSetting("quotation")]);
  return {
    reference: q.reference,
    createdAt: q.createdAt,
    validUntil: q.validUntil,
    status: q.status,
    clientName: q.clientName,
    clientCompany: q.clientCompany,
    clientEmail: q.clientEmail,
    clientPhone: q.clientPhone,
    clientAddress: q.clientAddress,
    projectTitle: q.projectTitle,
    taxName: q.taxName,
    taxRate: q.taxRate.toString(),
    subtotal: q.subtotal.toString(),
    taxAmount: q.taxAmount.toString(),
    total: q.total.toString(),
    terms: q.terms,
    notes: q.notes,
    items: q.items.map((i) => ({
      description: i.description,
      quantity: i.quantity.toString(),
      unitPrice: i.unitPrice.toString(),
      lineTotal: i.lineTotal.toString(),
    })),
    company: { phone: contact.phone, email: contact.email, address: quotationSettings.companyAddress },
  };
}

export { formatMoney };
