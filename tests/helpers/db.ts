import { beforeEach } from "vitest";
import { db } from "@/lib/server/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { setStoreOverridesForTests, type ObjectStore } from "@/lib/storage";
import { setEmailProviderForTests, type EmailProvider } from "@/lib/notifications/provider";
import { cookieJar, requestHeaders, revalidated } from "./setup";
import type { AdminRole } from "@/generated/prisma/enums";

export function memoryStore(): ObjectStore & { objects: Map<string, { bytes: Uint8Array; type: string }> } {
  const objects = new Map<string, { bytes: Uint8Array; type: string }>();
  return {
    objects,
    async put(key, body, type) {
      objects.set(key, { bytes: body, type });
      return { key, url: `https://store.test/${key}` };
    },
    async read(key) {
      const o = objects.get(key);
      if (!o) return null;
      return { body: new Response(o.bytes as BodyInit).body!, contentType: o.type };
    },
    async remove(key) {
      objects.delete(key);
    },
  };
}

export const stores = { public: memoryStore(), private: memoryStore() };

export type SentEmail = Parameters<EmailProvider["send"]>[0];
export const mail = {
  sent: [] as SentEmail[],
  behaviour: "ok" as "ok" | "fail" | "unconfigured",
  calls: 0,
};

const provider: EmailProvider = {
  async send(email) {
    mail.calls++;
    if (mail.behaviour === "fail") return { ok: false, error: "Provider rejected: domain not verified" };
    if (mail.behaviour === "unconfigured") return { ok: false, notConfigured: true, error: "RESEND_API_KEY is not configured" };
    mail.sent.push(email);
    return { ok: true, messageId: `msg_${mail.sent.length}` };
  },
};

const TABLES = [
  "AuditLog", "EmailNotification", "QuotationItem", "Quotation", "EnquiryStatusHistory", "EnquiryNote",
  "EnquiryAttachment", "Enquiry", "ProjectImage", "Project", "Article", "ArticleCategory", "Industry",
  "Service", "Media", "WebsiteSetting", "AdminSession", "AdminUser", "RateLimit",
];

beforeEach(async () => {
  await db().$executeRawUnsafe(`TRUNCATE ${TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`);
  cookieJar.clear();
  requestHeaders.clear();
  revalidated.length = 0;
  stores.public = memoryStore();
  stores.private = memoryStore();
  setStoreOverridesForTests({ public: stores.public, private: stores.private });
  mail.sent = [];
  mail.behaviour = "ok";
  mail.calls = 0;
  setEmailProviderForTests(provider);
});

export const PASSWORD = "CorrectHorse9Battery";

export async function makeUser(role: AdminRole, email = `${role.toLowerCase()}@test.example`) {
  return db().adminUser.create({
    data: { email, name: `${role} user`, role, passwordHash: await hashPassword(PASSWORD) },
  });
}

/** Signs in as a user by creating a real session and cookie. */
export async function signInAs(role: AdminRole) {
  const user = (await db().adminUser.findUnique({ where: { email: `${role.toLowerCase()}@test.example` } })) ?? (await makeUser(role));
  await createSession(user.id, "vitest");
  return user;
}

export function signOut() {
  cookieJar.clear();
}

export async function makePublishedService(slug = "electrical-installations", title = "Electrical Installations") {
  return db().service.create({
    data: { slug, title, summary: "Summary text for the service.", overview: ["o"], scope: ["s"], applications: ["a"], status: "PUBLISHED", publishedAt: new Date() },
  });
}

export const png = (extra = 0) =>
  new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 2, 0, 0, 0, 2, ...new Array(extra).fill(7)]);
export const pdf = () => new TextEncoder().encode("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n");
export { cookieJar, requestHeaders, revalidated, db };
