import { Resend } from "resend";
import { env } from "@/lib/server/env";

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer }[];
  idempotencyKey: string;
};

export type SendResult =
  | { ok: true; messageId: string | null }
  | { ok: false; notConfigured?: boolean; error: string };

export interface EmailProvider {
  send(email: OutgoingEmail): Promise<SendResult>;
}

const FALLBACK_FROM = "Zentrik Solutions <onboarding@resend.dev>";

export function senderAddress(): string {
  // The sending domain must be verified in Resend. Until EMAIL_FROM is set to a verified
  // address, Resend's shared test sender is used, which only delivers to the account owner.
  return env().EMAIL_FROM || FALLBACK_FROM;
}

export const resendProvider: EmailProvider = {
  async send(email) {
    const key = env().RESEND_API_KEY;
    if (!key) return { ok: false, notConfigured: true, error: "RESEND_API_KEY is not configured" };
    const resend = new Resend(key);
    const { data, error } = await resend.emails.send(
      {
        from: senderAddress(),
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        replyTo: email.replyTo,
        attachments: email.attachments,
      },
      { idempotencyKey: email.idempotencyKey },
    );
    if (error) return { ok: false, error: `${error.name}: ${error.message}` };
    return { ok: true, messageId: data?.id ?? null };
  },
};

let override: EmailProvider | undefined;
export function setEmailProviderForTests(p: EmailProvider | undefined) {
  override = p;
}
export function emailProvider(): EmailProvider {
  return override ?? resendProvider;
}
