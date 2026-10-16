import { describe, expect, it } from "vitest";
import { GET as downloadAttachment } from "@/app/admin/(app)/enquiries/[id]/attachments/[attachmentId]/route";
import { GET as quotationPdf } from "@/app/admin/(app)/quotations/[id]/pdf/route";
import { GET as cron } from "@/app/api/cron/notifications/route";
import { createEnquiry } from "@/lib/enquiry/service";
import { issueFormToken } from "@/lib/enquiry/spam";
import { addEnquiryNote, assignEnquiry, changeEnquiryStatus, getEnquiryDetail, listEnquiries } from "@/lib/enquiry/admin";
import { createQuotation } from "@/lib/quotation/service";
import { createUser, resetUserPassword, updateUser } from "@/lib/auth/users";
import { getSessionUser } from "@/lib/auth/session";
import { db, makePublishedService, makeUser, pdf, signInAs, signOut } from "../helpers/db";

async function enquiryWithFile() {
  await makePublishedService();
  const bytes = pdf();
  const r = await createEnquiry(
    { name: "Client", company: "", email: "client@example.com", phone: "", service: "electrical-installations", location: "Gweru", description: "A project description that is long enough.", budget: "", preferredStart: "", consent: "yes", website: "", formToken: issueFormToken(Date.now()) },
    [{ name: "confidential-drawing.pdf", type: "application/pdf", size: bytes.length, bytes }],
    { ip: "198.51.100.200", userAgent: null, now: new Date(Date.now() + 10_000) },
  );
  if (!r.ok) throw new Error("setup");
  const att = await db().enquiryAttachment.findFirstOrThrow({ where: { enquiryId: r.enquiryId } });
  return { enquiryId: r.enquiryId, attachmentId: att.id };
}

const call = (id: string, attachmentId: string) =>
  downloadAttachment(new Request("http://x"), { params: Promise.resolve({ id, attachmentId }) });

describe("private file access control", () => {
  it("denies anonymous access to client documents", async () => {
    const { enquiryId, attachmentId } = await enquiryWithFile();
    signOut();
    expect((await call(enquiryId, attachmentId)).status).toBe(401);
  });

  it("denies staff without enquiry permission (editor)", async () => {
    const { enquiryId, attachmentId } = await enquiryWithFile();
    await signInAs("EDITOR");
    expect((await call(enquiryId, attachmentId)).status).toBe(403);
  });

  it("streams the file with safe headers to authorised staff and logs the download", async () => {
    const { enquiryId, attachmentId } = await enquiryWithFile();
    await signInAs("SALES");
    const res = await call(enquiryId, attachmentId);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toContain("attachment");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(Buffer.from(await res.arrayBuffer()).toString()).toContain("%PDF-1.4");
    expect(await db().auditLog.count({ where: { action: "enquiry.attachment_download" } })).toBe(1);
  });

  it("does not leak a file through a mismatched enquiry id", async () => {
    const { attachmentId } = await enquiryWithFile();
    await signInAs("ADMIN");
    expect((await call("some-other-enquiry", attachmentId)).status).toBe(404);
  });

  it("never exposes private storage keys in public-facing data", async () => {
    await enquiryWithFile();
    const att = await db().enquiryAttachment.findFirstOrThrow();
    expect(att.storageKey.startsWith("enquiries/")).toBe(true);
    expect(await db().media.count()).toBe(0);
  });

  it("protects quotation PDFs", async () => {
    await signInAs("SALES");
    const q = await createQuotation({
      clientName: "Client", clientEmail: "c@example.com", projectTitle: "Project title", taxName: "VAT", taxRate: "15", validUntil: "2099-01-01",
      terms: "Terms and conditions apply.", items: [{ description: "Item", quantity: "1", unitPrice: "100" }],
    });
    const id = (q as { id: string }).id;
    const get = () => quotationPdf(new Request("http://x"), { params: Promise.resolve({ id }) });
    signOut();
    expect((await get()).status).toBe(401);
    await signInAs("EDITOR");
    expect((await get()).status).toBe(403);
    signOut();
    await signInAs("SALES");
    const ok = await get();
    expect(ok.status).toBe(200);
    expect(ok.headers.get("content-type")).toBe("application/pdf");
    expect(Buffer.from(await ok.arrayBuffer()).subarray(0, 5).toString()).toBe("%PDF-");
    expect((await quotationPdf(new Request("http://x"), { params: Promise.resolve({ id: "missing" }) })).status).toBe(404);
  });
});

describe("enquiry administration", () => {
  async function seed() {
    const { enquiryId } = await enquiryWithFile();
    return enquiryId;
  }

  it("lets sales change status, add notes and assign, with history", async () => {
    const id = await seed();
    const sales = await signInAs("SALES");
    expect(await changeEnquiryStatus(id, "UNDER_REVIEW", "Reviewing scope")).toEqual({ ok: true });
    expect(await changeEnquiryStatus(id, "CONTACTED")).toEqual({ ok: true });
    expect((await changeEnquiryStatus(id, "WON")).ok).toBe(false); // skipping the pipeline is refused
    expect(await addEnquiryNote(id, "Called client, site visit Friday.")).toEqual({ ok: true });
    expect(await assignEnquiry(id, sales.id)).toEqual({ ok: true });
    const d = (await getEnquiryDetail(id))!;
    expect(d.status).toBe("CONTACTED");
    expect(d.assignedTo?.id).toBe(sales.id);
    expect(d.notes).toHaveLength(1);
    expect(d.history.map((h) => h.toStatus).reverse()).toEqual(["NEW", "UNDER_REVIEW", "CONTACTED"]);
    expect(d.history[1]).toMatchObject({ toStatus: "UNDER_REVIEW", note: "Reviewing scope" });
    expect(await db().auditLog.count({ where: { entityType: "Enquiry" } })).toBeGreaterThanOrEqual(4);
  });

  it("filters the inbox by status, assignee and search", async () => {
    const id = await seed();
    const sales = await signInAs("SALES");
    await changeEnquiryStatus(id, "UNDER_REVIEW");
    await assignEnquiry(id, sales.id);
    expect((await listEnquiries({ status: "UNDER_REVIEW" })).total).toBe(1);
    expect((await listEnquiries({ status: "NEW" })).total).toBe(0);
    expect((await listEnquiries({ assignee: "me" })).total).toBe(1);
    expect((await listEnquiries({ assignee: "unassigned" })).total).toBe(0);
    expect((await listEnquiries({ q: "gweru" })).total).toBe(1);
    expect((await listEnquiries({ q: "nonexistent" })).total).toBe(0);
  });

  it("refuses everything to editors and anonymous callers", async () => {
    const id = await seed();
    await signInAs("EDITOR");
    await expect(listEnquiries({})).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(getEnquiryDetail(id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(changeEnquiryStatus(id, "UNDER_REVIEW")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(addEnquiryNote(id, "x")).rejects.toMatchObject({ code: "FORBIDDEN" });
    signOut();
    await expect(assignEnquiry(id, null)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    expect((await db().enquiry.findUniqueOrThrow({ where: { id } })).status).toBe("NEW");
  });

  it("cannot assign to an inactive or unknown user", async () => {
    const id = await seed();
    await signInAs("ADMIN");
    const gone = await makeUser("SALES", "gone@test.example");
    await db().adminUser.update({ where: { id: gone.id }, data: { active: false } });
    expect((await assignEnquiry(id, gone.id)).ok).toBe(false);
    expect((await assignEnquiry(id, "nope")).ok).toBe(false);
  });
});

describe("administrator account management", () => {
  it("is restricted to super admins", async () => {
    await signInAs("ADMIN");
    await expect(createUser({ email: "x@y.co", name: "X Y", role: "EDITOR", password: "GoodPassword1234" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("creates users with strong passwords only and unique emails", async () => {
    await signInAs("SUPER_ADMIN");
    expect((await createUser({ email: "new@test.example", name: "New User", role: "EDITOR", password: "weak" })).ok).toBe(false);
    expect((await createUser({ email: "new@test.example", name: "New User", role: "EDITOR", password: "GoodPassword1234" })).ok).toBe(true);
    expect((await createUser({ email: "NEW@test.example", name: "Dup", role: "EDITOR", password: "GoodPassword1234" })).ok).toBe(false);
  });

  it("protects the last super admin and the acting user", async () => {
    const me = await signInAs("SUPER_ADMIN");
    expect((await updateUser(me.id, { active: false })).ok).toBe(false);
    expect((await updateUser(me.id, { role: "ADMIN" })).ok).toBe(false);
    const other = await makeUser("SUPER_ADMIN", "second@test.example");
    expect((await updateUser(other.id, { role: "ADMIN" })).ok).toBe(true);
  });

  it("revokes sessions when a user is deactivated or has a password reset", async () => {
    await signInAs("SUPER_ADMIN");
    const victim = await makeUser("EDITOR", "victim@test.example");
    await db().adminSession.create({ data: { tokenHash: "h1", userId: victim.id, expiresAt: new Date(Date.now() + 1e6) } });
    expect((await updateUser(victim.id, { active: false })).ok).toBe(true);
    expect(await db().adminSession.count({ where: { userId: victim.id } })).toBe(0);
    await db().adminSession.create({ data: { tokenHash: "h2", userId: victim.id, expiresAt: new Date(Date.now() + 1e6) } });
    expect((await resetUserPassword(victim.id, "BrandNewPassw0rd")).ok).toBe(true);
    expect(await db().adminSession.count({ where: { userId: victim.id } })).toBe(0);
    expect(await getSessionUser()).not.toBeNull();
  });
});

describe("cron endpoint", () => {
  it("rejects missing or wrong secrets", async () => {
    expect((await cron(new Request("http://x"))).status).toBe(401);
    expect((await cron(new Request("http://x", { headers: { authorization: "Bearer wrong" } }))).status).toBe(401);
  });
  it("processes pending notifications with the correct secret", async () => {
    await enquiryWithFile();
    const res = await cron(new Request("http://x", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notifications.sent).toBe(2);
  });
});
