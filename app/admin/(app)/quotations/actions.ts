"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AuthError } from "@/lib/auth/session";
import { createQuotation, sendQuotation, setQuotationStatus, updateQuotation } from "@/lib/quotation/service";
import { processNotifications } from "@/lib/notifications/processor";
import { quotationFromForm } from "@/lib/quotation/form";
import type { FormState } from "@/components/admin/form";
import type { QuotationStatus } from "@/generated/prisma/enums";

async function guard<T extends { ok: boolean }>(fn: () => Promise<T>): Promise<T | { ok: false; error: string }> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.code === "FORBIDDEN" ? "You do not have permission to do that." : "Your session has expired. Sign in again." };
    throw e;
  }
}

export async function createQuotationAction(_p: FormState, fd: FormData): Promise<FormState> {
  const res = await guard(() => createQuotation(quotationFromForm(fd)));
  if (!res.ok) return { ok: false, error: res.error, fieldErrors: "fieldErrors" in res ? res.fieldErrors : undefined };
  redirect(`/admin/quotations/${(res as { id: string }).id}`);
}

export async function updateQuotationAction(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  const res = await guard(() => updateQuotation(id, quotationFromForm(fd)));
  if (!res.ok) return { ok: false, error: res.error, fieldErrors: "fieldErrors" in res ? res.fieldErrors : undefined };
  revalidatePath(`/admin/quotations/${id}`);
  return { ok: true, message: "Quotation saved." };
}

export async function sendQuotationAction(id: string, _p: FormState, _fd: FormData): Promise<FormState> {
  const res = await guard(() => sendQuotation(id));
  if (!res.ok) return { ok: false, error: res.error };
  const nid = (res as { notificationId: string }).notificationId;
  after(async () => {
    try { await processNotifications({ ids: [nid] }); } catch (e) { console.error("quotation email processing failed", String(e)); }
  });
  revalidatePath(`/admin/quotations/${id}`);
  return { ok: true, message: "Quotation queued for delivery. Delivery status is shown below." };
}

export async function quotationStatusAction(id: string, to: QuotationStatus, _p: FormState, _fd: FormData): Promise<FormState> {
  const res = await guard(() => setQuotationStatus(id, to));
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath(`/admin/quotations/${id}`);
  return { ok: true, message: `Marked ${to.toLowerCase()}.` };
}
