import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { EnquiryStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { authorize } from "@/lib/auth/session";
import { canTransition } from "./workflow";

const STATUSES = [
  "NEW", "UNDER_REVIEW", "CONTACTED", "SITE_VISIT_SCHEDULED", "QUOTATION_PREPARED",
  "QUOTATION_SENT", "WON", "LOST", "CLOSED",
] as const;

export const PAGE_SIZE = 20;

export type EnquiryFilters = {
  status?: string;
  assignee?: string; // "me" | "unassigned" | user id
  q?: string;
  page?: number;
};

export async function listEnquiries(filters: EnquiryFilters) {
  const user = await authorize("enquiries:read");
  const where: Prisma.EnquiryWhereInput = {};
  if (filters.status && (STATUSES as readonly string[]).includes(filters.status))
    where.status = filters.status as EnquiryStatus;
  if (filters.assignee === "me") where.assignedToId = user.id;
  else if (filters.assignee === "unassigned") where.assignedToId = null;
  else if (filters.assignee) where.assignedToId = filters.assignee;
  const q = filters.q?.trim();
  if (q)
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
    ];
  const page = Math.max(1, filters.page ?? 1);
  const [items, total] = await Promise.all([
    db().enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { assignedTo: { select: { name: true } }, _count: { select: { attachments: true } } },
    }),
    db().enquiry.count({ where }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getEnquiryDetail(id: string) {
  await authorize("enquiries:read");
  return db().enquiry.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true } },
      attachments: { orderBy: { createdAt: "asc" } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
      history: { orderBy: { createdAt: "desc" }, include: { changedBy: { select: { name: true } } } },
      quotations: { orderBy: { createdAt: "desc" }, select: { id: true, reference: true, status: true, total: true } },
      notifications: { orderBy: { createdAt: "asc" }, select: { id: true, kind: true, status: true, attempts: true, lastError: true, sentAt: true } },
    },
  });
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function changeEnquiryStatus(id: string, to: string, note?: string): Promise<ActionResult> {
  const user = await authorize("enquiries:write");
  if (!(STATUSES as readonly string[]).includes(to)) return { ok: false, error: "Unknown status." };
  const target = to as EnquiryStatus;
  const enquiry = await db().enquiry.findUnique({ where: { id }, select: { status: true } });
  if (!enquiry) return { ok: false, error: "Enquiry not found." };
  if (!canTransition(enquiry.status, target))
    return { ok: false, error: `An enquiry cannot move from ${enquiry.status} to ${target}.` };
  await db().$transaction([
    db().enquiry.update({ where: { id }, data: { status: target } }),
    db().enquiryStatusHistory.create({
      data: { enquiryId: id, fromStatus: enquiry.status, toStatus: target, changedById: user.id, note: note?.trim().slice(0, 500) || null },
    }),
  ]);
  await audit(user, "enquiry.status", "Enquiry", id, { from: enquiry.status, to: target });
  return { ok: true };
}

export async function addEnquiryNote(id: string, body: string): Promise<ActionResult> {
  const user = await authorize("enquiries:write");
  const parsed = z.string().trim().min(1, "Write a note.").max(4000).safeParse(body);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]!.message };
  const exists = await db().enquiry.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return { ok: false, error: "Enquiry not found." };
  await db().enquiryNote.create({ data: { enquiryId: id, authorId: user.id, body: parsed.data } });
  await audit(user, "enquiry.note", "Enquiry", id);
  return { ok: true };
}

export async function assignEnquiry(id: string, userId: string | null): Promise<ActionResult> {
  const user = await authorize("enquiries:assign");
  if (userId) {
    const assignee = await db().adminUser.findFirst({ where: { id: userId, active: true }, select: { id: true } });
    if (!assignee) return { ok: false, error: "That user cannot be assigned." };
  }
  const res = await db().enquiry.updateMany({ where: { id }, data: { assignedToId: userId } });
  if (res.count === 0) return { ok: false, error: "Enquiry not found." };
  await audit(user, "enquiry.assign", "Enquiry", id, { to: userId });
  return { ok: true };
}

/** Loads a private attachment record, only for authorised administrators. */
export async function getAttachmentForDownload(enquiryId: string, attachmentId: string) {
  await authorize("enquiries:read");
  return db().enquiryAttachment.findFirst({ where: { id: attachmentId, enquiryId } });
}
