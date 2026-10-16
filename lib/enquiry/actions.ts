"use server";

import { after } from "next/server";
import { log } from "@/lib/server/log";
import { createEnquiry, type UploadedFile } from "@/lib/enquiry/service";
import { ENQUIRY_FIELD_NAMES, type EnquiryActionState } from "@/lib/enquiry/schema";
import { processNotifications } from "@/lib/notifications/processor";
import { clientIp, userAgent } from "@/lib/server/request";

export async function submitEnquiryAction(
  _prev: EnquiryActionState,
  formData: FormData,
): Promise<EnquiryActionState> {
  const raw: Record<string, string> = {};
  for (const name of [...ENQUIRY_FIELD_NAMES, "website", "formToken"]) {
    const v = formData.get(name);
    raw[name] = typeof v === "string" ? v.slice(0, 4000) : "";
  }

  const files: UploadedFile[] = [];
  for (const entry of formData.getAll("documents")) {
    if (typeof entry === "string" || entry.size === 0) continue;
    files.push({
      name: entry.name,
      type: entry.type,
      size: entry.size,
      bytes: new Uint8Array(await entry.arrayBuffer()),
    });
  }

  const result = await createEnquiry(raw, files, { ip: await clientIp(), userAgent: await userAgent() });
  const { website: _w, formToken: _t, ...values } = raw;
  void _w; void _t;

  if (!result.ok) {
    if (result.kind === "invalid") return { status: "invalid", values, errors: result.errors };
    return { status: "error", values, errors: {}, message: result.message };
  }

  // The enquiry is already committed. Email delivery runs after the response and
  // is retried by the cron job if it fails, so it can never lose the enquiry.
  after(async () => {
    try {
      await processNotifications({ ids: result.notificationIds });
    } catch (err) {
      log("error", "enquiry.post_submit_processing_failed", {}, err);
    }
  });

  return { status: "success", reference: result.reference, values: {}, errors: {} };
}
