import { describe, expect, it } from "vitest";
import { createEnquiry } from "@/lib/enquiry/service";
import { issueFormToken } from "@/lib/enquiry/spam";
import { processNotifications, MAX_ATTEMPTS } from "@/lib/notifications/processor";
import { db, mail, makePublishedService } from "../helpers/db";

async function submit() {
  await makePublishedService();
  const r = await createEnquiry(
    {
      name: "Rudo Chari", company: "", email: "rudo@example.com", phone: "", service: "electrical-installations",
      location: "Harare", description: "Rewire an office block of three floors.", budget: "", preferredStart: "",
      consent: "yes", website: "", formToken: issueFormToken(Date.now()),
    },
    [],
    { ip: "198.51.100.77", userAgent: null, now: new Date(Date.now() + 10_000) },
  );
  if (!r.ok) throw new Error("setup failed");
  return r;
}

describe("email notifications", () => {
  it("sends the company notification and the client acknowledgement", async () => {
    const r = await submit();
    const s = await processNotifications({ ids: r.notificationIds });
    expect(s).toMatchObject({ claimed: 2, sent: 2, failed: 0 });
    const toCompany = mail.sent.find((m) => m.to === "info@zentriksolutions.com")!;
    const toClient = mail.sent.find((m) => m.to === "rudo@example.com")!;
    expect(toCompany.subject).toContain(r.reference);
    expect(toCompany.replyTo).toBe("rudo@example.com");
    expect(toCompany.html).toContain("/admin/enquiries/");
    expect(toClient.subject).toContain(r.reference);
    expect(toClient.text).toContain(r.reference);
    const rows = await db().emailNotification.findMany();
    expect(rows.every((n) => n.status === "SENT" && n.sentAt && n.providerMessageId)).toBe(true);
  });

  it("escapes client-supplied HTML in emails", async () => {
    await makePublishedService();
    const r = await createEnquiry(
      { name: "<script>alert(1)</script>", company: "", email: "x@example.com", phone: "", service: "electrical-installations", location: "<b>Here</b>", description: "A long enough description with <img src=x onerror=alert(1)>", budget: "", preferredStart: "", consent: "yes", website: "", formToken: issueFormToken(Date.now()) },
      [], { ip: "198.51.100.88", userAgent: null, now: new Date(Date.now() + 10_000) },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    await processNotifications({ ids: r.notificationIds });
    const html = mail.sent.map((m) => m.html).join("\n");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });

  it("keeps the enquiry when email fails, records the error, and retries later", async () => {
    const r = await submit();
    mail.behaviour = "fail";
    const first = await processNotifications({ ids: r.notificationIds });
    expect(first.failed).toBe(2);

    // The enquiry is intact and visible.
    expect(await db().enquiry.findUnique({ where: { id: r.enquiryId } })).not.toBeNull();
    const failed = await db().emailNotification.findMany();
    expect(failed.every((n) => n.status === "FAILED" && n.attempts === 1 && n.lastError?.includes("domain not verified"))).toBe(true);

    // Not retried before the backoff elapses.
    expect((await processNotifications()).claimed).toBe(0);

    // After the backoff, the cron retry succeeds.
    await db().emailNotification.updateMany({ data: { nextAttemptAt: new Date(Date.now() - 1000) } });
    mail.behaviour = "ok";
    const retry = await processNotifications();
    expect(retry.sent).toBe(2);
    expect((await db().emailNotification.findMany()).every((n) => n.status === "SENT")).toBe(true);
  });

  it("is idempotent: processing twice sends each email once", async () => {
    const r = await submit();
    await processNotifications({ ids: r.notificationIds });
    await processNotifications({ ids: r.notificationIds });
    await processNotifications();
    expect(mail.sent).toHaveLength(2);
  });

  it("prevents duplicate notification rows for the same event", async () => {
    const r = await submit();
    await expect(
      db().emailNotification.create({ data: { kind: "ENQUIRY_COMPANY", idempotencyKey: `enquiry:${r.enquiryId}:company`, toEmail: "", payload: {} } }),
    ).rejects.toThrow();
  });

  it("concurrent workers never double-send", async () => {
    const r = await submit();
    await Promise.all([processNotifications({ ids: r.notificationIds }), processNotifications({ ids: r.notificationIds }), processNotifications()]);
    expect(mail.sent).toHaveLength(2);
  });

  it("defers (without burning attempts) when the provider is not configured", async () => {
    const r = await submit();
    mail.behaviour = "unconfigured";
    const s = await processNotifications({ ids: r.notificationIds });
    expect(s.deferred).toBe(2);
    const rows = await db().emailNotification.findMany();
    expect(rows.every((n) => n.status === "PENDING" && n.attempts === 0 && n.lastError?.includes("RESEND_API_KEY"))).toBe(true);
  });

  it("stops retrying after the maximum number of attempts", async () => {
    const r = await submit();
    mail.behaviour = "fail";
    for (let i = 0; i < MAX_ATTEMPTS + 2; i++) {
      await db().emailNotification.updateMany({ data: { nextAttemptAt: new Date(Date.now() - 1000) } });
      await processNotifications();
    }
    const rows = await db().emailNotification.findMany({ where: { enquiryId: r.enquiryId } });
    expect(rows.every((n) => n.status === "FAILED" && n.attempts === MAX_ATTEMPTS)).toBe(true);
    expect(mail.calls).toBe(2 * MAX_ATTEMPTS);
  });

  it("marks notifications permanently failed if the enquiry was deleted", async () => {
    const r = await submit();
    await db().enquiry.delete({ where: { id: r.enquiryId } });
    const s = await processNotifications();
    expect(s.failed).toBeGreaterThan(0);
    expect(mail.sent).toHaveLength(0);
  });
});
