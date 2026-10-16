"use server";

import { revalidatePath } from "next/cache";
import { addEnquiryNote, assignEnquiry, changeEnquiryStatus } from "@/lib/enquiry/admin";
import { AuthError } from "@/lib/auth/session";
import type { FormState } from "@/components/admin/form";

async function guard<T>(fn: () => Promise<T>): Promise<T | { ok: false; error: string }> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.code === "FORBIDDEN" ? "You do not have permission to do that." : "Your session has expired. Sign in again." };
    throw e;
  }
}

export async function changeStatusAction(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  const res = await guard(() => changeEnquiryStatus(id, String(fd.get("status") ?? ""), String(fd.get("note") ?? "")));
  if (res.ok) revalidatePath(`/admin/enquiries/${id}`);
  return res.ok ? { ok: true, message: "Status updated." } : { ok: false, error: res.error };
}

export async function addNoteAction(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  const res = await guard(() => addEnquiryNote(id, String(fd.get("body") ?? "")));
  if (res.ok) revalidatePath(`/admin/enquiries/${id}`);
  return res.ok ? { ok: true, message: "Note added." } : { ok: false, error: res.error };
}

export async function assignAction(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  const to = String(fd.get("assignee") ?? "");
  const res = await guard(() => assignEnquiry(id, to || null));
  if (res.ok) revalidatePath(`/admin/enquiries/${id}`);
  return res.ok ? { ok: true, message: "Assignment saved." } : { ok: false, error: res.error };
}
