import { db } from "@/lib/server/db";
import { randomToken, hashIp } from "@/lib/server/crypto";
import { rateLimit } from "@/lib/server/rate-limit";
import { privateStore } from "@/lib/storage";
import {
  ENQUIRY_DOCUMENT_KINDS,
  LIMITS,
  validateFile,
  type ValidatedFile,
} from "@/lib/server/file-validation";
import { enquirySchema, fieldErrors, type EnquiryFieldErrors } from "./schema";
import { CONSENT_TEXT_VERSION, MULTIPLE_SERVICES, type ServiceOption } from "./constants";
import { formatEnquiryReference } from "./workflow";
import { verifyFormToken } from "./spam";

export type UploadedFile = { name: string; type: string; size: number; bytes: Uint8Array };

export type CreateEnquiryContext = {
  ip: string | null;
  userAgent: string | null;
  now?: Date;
};

export type CreateEnquiryResult =
  | { ok: true; enquiryId: string; reference: string; notificationIds: string[] }
  | { ok: false; kind: "invalid"; errors: EnquiryFieldErrors }
  | { ok: false; kind: "rate_limited" | "spam" | "error"; message: string };

export async function createEnquiry(
  raw: Record<string, string>,
  files: UploadedFile[],
  ctx: CreateEnquiryContext,
): Promise<CreateEnquiryResult> {
  // 1. Anti-spam: honeypot and signed form timing token.
  if (raw.website) return { ok: false, kind: "spam", message: "Submission rejected." };
  if (!verifyFormToken(raw.formToken, (ctx.now ?? new Date()).getTime()))
    return {
      ok: false,
      kind: "spam",
      message: "The form expired or was submitted too quickly. Please review it and try again.",
    };

  // 2. Server-side validation.
  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, kind: "invalid", errors: fieldErrors(parsed.error) };
  const input = parsed.data;

  // 3. Rate limiting (per network address and per email address).
  const ipKey = hashIp(ctx.ip) ?? "unknown";
  const [byIp, byEmail] = await Promise.all([
    rateLimit(`enquiry:ip:${ipKey}`, 5, 3600),
    rateLimit(`enquiry:email:${input.email}`, 5, 24 * 3600),
  ]);
  if (!byIp.allowed || !byEmail.allowed)
    return {
      ok: false,
      kind: "rate_limited",
      message: "Too many enquiries from this connection. Please try again later or call us.",
    };

  // 4. Resolve the service against published content.
  let serviceId: string | null = null;
  let serviceLabel = "Multiple services / not sure yet";
  if (input.service !== MULTIPLE_SERVICES) {
    const service = await db().service.findFirst({
      where: { slug: input.service, status: "PUBLISHED" },
      select: { id: true, title: true },
    });
    if (!service) return { ok: false, kind: "invalid", errors: { service: "Select a valid service." } };
    serviceId = service.id;
    serviceLabel = service.title;
  }

  // 5. Validate attachments (size, declared type AND magic bytes).
  const checked: { file: UploadedFile; meta: ValidatedFile }[] = [];
  if (files.length > LIMITS.enquiryMaxFiles)
    return { ok: false, kind: "invalid", errors: { documents: `Attach at most ${LIMITS.enquiryMaxFiles} files.` } };
  if (files.reduce((n, f) => n + f.size, 0) > LIMITS.enquiryTotalBytes)
    return { ok: false, kind: "invalid", errors: { documents: "Attachments must total 4 MB or less." } };
  for (const file of files) {
    const res = validateFile(file, ENQUIRY_DOCUMENT_KINDS, LIMITS.enquiryFileBytes);
    if (!res.ok) return { ok: false, kind: "invalid", errors: { documents: res.error } };
    checked.push({ file, meta: res.file });
  }

  // 6. Upload to the PRIVATE store first; remove them again if the database write fails.
  const uploaded: { key: string; filename: string; mimeType: string; size: number }[] = [];
  try {
    const year = (ctx.now ?? new Date()).getUTCFullYear();
    for (const { file, meta } of checked) {
      const key = `enquiries/${year}/${randomToken(12)}-${meta.safeName}`;
      await privateStore().put(key, file.bytes, meta.mime);
      uploaded.push({ key, filename: meta.safeName, mimeType: meta.mime, size: file.size });
    }
  } catch (err) {
    await cleanup(uploaded.map((u) => u.key));
    console.error("enquiry attachment upload failed", String(err));
    return { ok: false, kind: "error", message: "We could not store your attachments. Please try again or send the enquiry without them." };
  }

  // 7. One transaction: enquiry, reference, initial status, attachments, notification outbox.
  try {
    const now = ctx.now ?? new Date();
    const result = await db().$transaction(async (tx) => {
      const created = await tx.enquiry.create({
        data: {
          reference: `PENDING-${randomToken(9)}`,
          name: input.name,
          company: input.company ?? null,
          email: input.email,
          phone: input.phone ?? null,
          serviceId,
          serviceLabel,
          location: input.location,
          description: input.description,
          budgetRange: input.budget ?? null,
          preferredStart: input.preferredStart ? new Date(`${input.preferredStart}T00:00:00Z`) : null,
          consentGiven: true,
          consentAt: now,
          ipHash: hashIp(ctx.ip),
          userAgent: ctx.userAgent,
          status: "NEW",
        },
      });
      const reference = formatEnquiryReference(created.seq, now);
      await tx.enquiry.update({ where: { id: created.id }, data: { reference } });
      await tx.enquiryStatusHistory.create({
        data: { enquiryId: created.id, fromStatus: null, toStatus: "NEW", note: "Enquiry received" },
      });
      if (uploaded.length > 0) {
        await tx.enquiryAttachment.createMany({
          data: uploaded.map((u) => ({
            enquiryId: created.id,
            storageKey: u.key,
            filename: u.filename,
            mimeType: u.mimeType,
            size: u.size,
          })),
        });
      }
      const company = await tx.emailNotification.create({
        data: {
          kind: "ENQUIRY_COMPANY",
          idempotencyKey: `enquiry:${created.id}:company`,
          toEmail: "", // resolved from settings when sent
          payload: { enquiryId: created.id },
          enquiryId: created.id,
        },
      });
      const ack = await tx.emailNotification.create({
        data: {
          kind: "ENQUIRY_ACKNOWLEDGEMENT",
          idempotencyKey: `enquiry:${created.id}:ack`,
          toEmail: input.email,
          payload: { enquiryId: created.id },
          enquiryId: created.id,
        },
      });
      return { id: created.id, reference, notificationIds: [company.id, ack.id] };
    });
    return { ok: true, enquiryId: result.id, reference: result.reference, notificationIds: result.notificationIds };
  } catch (err) {
    await cleanup(uploaded.map((u) => u.key));
    console.error("enquiry transaction failed", String(err));
    return { ok: false, kind: "error", message: "We could not save your enquiry. Nothing was sent. Please try again or contact us directly." };
  }
}

async function cleanup(keys: string[]) {
  await Promise.all(
    keys.map((k) => privateStore().remove(k).catch((e) => console.error("orphan cleanup failed", k, String(e)))),
  );
}

export { CONSENT_TEXT_VERSION };
export type { ServiceOption };
