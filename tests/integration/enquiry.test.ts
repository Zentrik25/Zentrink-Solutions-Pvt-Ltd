import { describe, expect, it, vi } from "vitest";
import { createEnquiry } from "@/lib/enquiry/service";
import { issueFormToken } from "@/lib/enquiry/spam";
import { db, makePublishedService, pdf, png, stores } from "../helpers/db";

const ctx = (ip = "198.51.100.7") => ({ ip, userAgent: "vitest", now: new Date(Date.now() + 10_000) });
const token = () => issueFormToken(Date.now());

const valid = (over: Record<string, string> = {}) => ({
  name: "Tendai Moyo",
  company: "Moyo Farming",
  email: "tendai@example.com",
  phone: "+263 77 123 4567",
  service: "electrical-installations",
  location: "Marondera",
  description: "Install a new distribution board and wiring for a packhouse.",
  budget: "5k-20k",
  preferredStart: "",
  consent: "yes",
  website: "",
  formToken: token(),
  ...over,
});

describe("enquiry submission", () => {
  it("saves the enquiry, reference, initial status and notifications in one transaction", async () => {
    await makePublishedService();
    const r = await createEnquiry(valid(), [], ctx());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.reference).toMatch(/^ZS-ENQ-\d{4}-\d{5}$/);

    const e = await db().enquiry.findUniqueOrThrow({
      where: { id: r.enquiryId },
      include: { history: true, notifications: true },
    });
    expect(e.reference).toBe(r.reference);
    expect(e.status).toBe("NEW");
    expect(e.consentGiven).toBe(true);
    expect(e.serviceLabel).toBe("Electrical Installations");
    expect(e.ipHash).toBeTruthy();
    expect(e.ipHash).not.toContain("198.51");
    expect(e.history).toHaveLength(1);
    expect(e.history[0]).toMatchObject({ fromStatus: null, toStatus: "NEW" });
    expect(e.notifications.map((n) => n.kind).sort()).toEqual(["ENQUIRY_ACKNOWLEDGEMENT", "ENQUIRY_COMPANY"]);
    expect(e.notifications.every((n) => n.status === "PENDING")).toBe(true);
  });

  it("generates unique, sequential references", async () => {
    await makePublishedService();
    const a = await createEnquiry(valid({ email: "a@example.com" }), [], ctx("198.51.100.1"));
    const b = await createEnquiry(valid({ email: "b@example.com" }), [], ctx("198.51.100.2"));
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) expect(a.reference).not.toBe(b.reference);
  });

  it("rejects invalid input with field errors and saves nothing", async () => {
    await makePublishedService();
    const r = await createEnquiry(valid({ email: "nope", description: "short", consent: "" }), [], ctx());
    expect(r).toMatchObject({ ok: false, kind: "invalid" });
    if (!r.ok && r.kind === "invalid") expect(Object.keys(r.errors).sort()).toEqual(["consent", "description", "email"]);
    expect(await db().enquiry.count()).toBe(0);
    expect(await db().emailNotification.count()).toBe(0);
  });

  it("rejects an unknown or unpublished service", async () => {
    const draft = await db().service.create({ data: { slug: "secret", title: "Secret", summary: "Draft service summary.", overview: [], scope: [], applications: [] } });
    expect(draft.status).toBe("DRAFT");
    const r = await createEnquiry(valid({ service: "secret" }), [], ctx());
    expect(r).toMatchObject({ ok: false, kind: "invalid" });
    expect(await db().enquiry.count()).toBe(0);
  });

  it("blocks bots: honeypot, missing token and instant submission", async () => {
    await makePublishedService();
    expect(await createEnquiry(valid({ website: "http://spam" }), [], ctx())).toMatchObject({ ok: false, kind: "spam" });
    expect(await createEnquiry(valid({ formToken: "" }), [], ctx())).toMatchObject({ ok: false, kind: "spam" });
    const instant = await createEnquiry(valid(), [], { ip: "1.1.1.1", userAgent: null, now: new Date() });
    expect(instant).toMatchObject({ ok: false, kind: "spam" });
    expect(await db().enquiry.count()).toBe(0);
  });

  it("rate limits repeat submissions from one connection", async () => {
    await makePublishedService();
    const results = [];
    for (let i = 0; i < 6; i++) results.push(await createEnquiry(valid({ email: `p${i}@example.com`, formToken: token() }), [], ctx("192.0.2.50")));
    expect(results.slice(0, 5).every((r) => r.ok)).toBe(true);
    expect(results[5]).toMatchObject({ ok: false, kind: "rate_limited" });
    expect(await db().enquiry.count()).toBe(5);
  });

  it("stores valid attachments in the PRIVATE store only", async () => {
    await makePublishedService();
    const r = await createEnquiry(valid(), [{ name: "site plan.pdf", type: "application/pdf", size: pdf().length, bytes: pdf() }], ctx());
    expect(r.ok).toBe(true);
    const att = await db().enquiryAttachment.findFirstOrThrow();
    expect(att.filename).toBe("site-plan.pdf");
    expect(stores.private.objects.has(att.storageKey)).toBe(true);
    expect(stores.public.objects.size).toBe(0);
  });

  it("rejects disguised or oversized attachments and saves nothing", async () => {
    await makePublishedService();
    const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0, 1, 2, 3, 4, 5, 6]);
    const bad = await createEnquiry(valid(), [{ name: "plan.pdf", type: "application/pdf", size: exe.length, bytes: exe }], ctx());
    expect(bad).toMatchObject({ ok: false, kind: "invalid" });
    const big = await createEnquiry(valid({ formToken: token() }), [{ name: "a.png", type: "image/png", size: 3.5 * 1024 * 1024, bytes: png() }], ctx());
    expect(big).toMatchObject({ ok: false, kind: "invalid" });
    const many = await createEnquiry(valid({ formToken: token() }), Array.from({ length: 4 }, () => ({ name: "a.png", type: "image/png", size: 10, bytes: png() })), ctx());
    expect(many).toMatchObject({ ok: false, kind: "invalid" });
    expect(await db().enquiry.count()).toBe(0);
    expect(stores.private.objects.size).toBe(0);
  });

  it("never reports success when the database transaction fails, and removes uploaded files", async () => {
    await makePublishedService();
    const spy = vi.spyOn(db(), "$transaction").mockRejectedValueOnce(new Error("connection reset"));
    const r = await createEnquiry(valid(), [{ name: "plan.pdf", type: "application/pdf", size: pdf().length, bytes: pdf() }], ctx());
    spy.mockRestore();
    expect(r).toMatchObject({ ok: false, kind: "error" });
    expect(await db().enquiry.count()).toBe(0);
    expect(stores.private.objects.size).toBe(0);
  });

  it("returns an error and saves nothing when storage is unavailable", async () => {
    await makePublishedService();
    stores.private.put = async () => {
      throw new Error("blob down");
    };
    const r = await createEnquiry(valid(), [{ name: "plan.pdf", type: "application/pdf", size: pdf().length, bytes: pdf() }], ctx());
    expect(r).toMatchObject({ ok: false, kind: "error" });
    expect(await db().enquiry.count()).toBe(0);
  });

  it("enforces consent at the database level", async () => {
    await expect(
      db().enquiry.create({ data: { reference: "X", name: "n", email: "e@e.co", serviceLabel: "s", location: "l", description: "d".repeat(20), consentGiven: false, consentAt: new Date() } }),
    ).rejects.toThrow();
  });
});
