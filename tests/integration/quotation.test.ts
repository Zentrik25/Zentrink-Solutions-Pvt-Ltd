import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createQuotation, loadQuotationForPdf, sendQuotation, setQuotationStatus, updateQuotation } from "@/lib/quotation/service";
import { buildQuotationPdf } from "@/lib/quotation/pdf";
import { processNotifications } from "@/lib/notifications/processor";
import { db, mail, signInAs, signOut } from "../helpers/db";

const input = (over: Record<string, unknown> = {}) => ({
  clientName: "Chipo Ndlovu", clientCompany: "Ndlovu Mills", clientEmail: "chipo@example.com", clientPhone: "+263 77 000 1111",
  projectTitle: "Distribution board upgrade", taxName: "VAT", taxRate: "15", validUntil: "2099-01-31",
  terms: "Valid for the period shown. Payment terms to be agreed.",
  items: [
    { description: "Main distribution board", quantity: "1", unitPrice: "1250.50" },
    { description: "Cable, 16mm2 (per metre)", quantity: "42.5", unitPrice: "6.35" },
  ],
  ...over,
});

async function makeEnquiry() {
  return db().enquiry.create({
    data: { reference: "ZS-ENQ-2026-00001", name: "Chipo", email: "chipo@example.com", serviceLabel: "Electrical Installations", location: "Bulawayo", description: "x".repeat(30), consentGiven: true, consentAt: new Date(), status: "SITE_VISIT_SCHEDULED" },
  });
}

describe("quotations", () => {
  it("persists exact decimal totals and a unique reference", async () => {
    await signInAs("SALES");
    const r = await createQuotation(input());
    expect(r.ok).toBe(true);
    const q = await db().quotation.findUniqueOrThrow({ where: { id: (r as { id: string }).id }, include: { items: { orderBy: { position: "asc" } } } });
    expect(q.reference).toMatch(/^ZS-Q-\d{4}-\d{4}$/);
    expect(q.currency).toBe("USD");
    // 1250.50 + (42.5 * 6.35 = 269.875 -> 269.88) = 1520.38 ; tax 15% = 228.0570 -> 228.06
    expect(q.items.map((i) => i.lineTotal.toString())).toEqual(["1250.5", "269.88"]);
    expect(q.subtotal.toString()).toBe("1520.38");
    expect(q.taxAmount.toString()).toBe("228.06");
    expect(q.total.toString()).toBe("1748.44");
    const second = await createQuotation(input());
    const q2 = await db().quotation.findUniqueOrThrow({ where: { id: (second as { id: string }).id } });
    expect(q2.reference).not.toBe(q.reference);
  });

  it("rejects invalid items and writes nothing", async () => {
    await signInAs("SALES");
    expect((await createQuotation(input({ items: [{ description: "x", quantity: "0", unitPrice: "10" }] }))).ok).toBe(false);
    expect((await createQuotation(input({ items: [{ description: "x", quantity: "1", unitPrice: "-5" }] }))).ok).toBe(false);
    expect((await createQuotation(input({ items: [] }))).ok).toBe(false);
    expect((await createQuotation(input({ taxRate: "150" }))).ok).toBe(false);
    expect(await db().quotation.count()).toBe(0);
  });

  it("enforces money integrity in the database itself", async () => {
    await signInAs("SALES");
    const r = await createQuotation(input());
    const id = (r as { id: string }).id;
    await expect(db().quotation.update({ where: { id }, data: { currency: "ZWL" } })).rejects.toThrow();
    await expect(db().quotationItem.create({ data: { quotationId: id, position: 9, description: "x", quantity: "0", unitPrice: "1", lineTotal: "0" } })).rejects.toThrow();
    await expect(db().quotation.update({ where: { id }, data: { total: "-1" } })).rejects.toThrow();
  });

  it("moves the linked enquiry through Quotation Prepared and Quotation Sent with history", async () => {
    await signInAs("SALES");
    const enquiry = await makeEnquiry();
    const r = await createQuotation(input({ enquiryId: enquiry.id }));
    expect((await db().enquiry.findUniqueOrThrow({ where: { id: enquiry.id } })).status).toBe("QUOTATION_PREPARED");
    await sendQuotation((r as { id: string }).id);
    expect((await db().enquiry.findUniqueOrThrow({ where: { id: enquiry.id } })).status).toBe("QUOTATION_SENT");
    const history = await db().enquiryStatusHistory.findMany({ where: { enquiryId: enquiry.id }, orderBy: { createdAt: "asc" } });
    expect(history.map((h) => h.toStatus)).toEqual(["QUOTATION_PREPARED", "QUOTATION_SENT"]);
    await setQuotationStatus((r as { id: string }).id, "ACCEPTED");
    expect((await db().enquiry.findUniqueOrThrow({ where: { id: enquiry.id } })).status).toBe("WON");
  });

  it("only drafts are editable", async () => {
    await signInAs("SALES");
    const r = await createQuotation(input());
    const id = (r as { id: string }).id;
    expect((await updateQuotation(id, input({ projectTitle: "Updated title" }))).ok).toBe(true);
    expect((await db().quotation.findUniqueOrThrow({ where: { id } })).projectTitle).toBe("Updated title");
    await sendQuotation(id);
    expect(await updateQuotation(id, input())).toMatchObject({ ok: false });
  });

  it("emails the quotation as a valid PDF attachment, exactly once", async () => {
    await signInAs("SALES");
    const r = await createQuotation(input());
    const sent = await sendQuotation((r as { id: string }).id);
    expect(sent.ok).toBe(true);
    await processNotifications({ ids: [(sent as { notificationId: string }).notificationId] });
    await processNotifications();
    expect(mail.sent).toHaveLength(1);
    const email = mail.sent[0]!;
    expect(email.to).toBe("chipo@example.com");
    expect(email.attachments?.[0]?.filename).toMatch(/^ZS-Q-\d{4}-\d{4}\.pdf$/);
    const doc = await PDFDocument.load(email.attachments![0]!.content);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
    expect((await db().quotation.findFirstOrThrow()).status).toBe("SENT");
  });

  it("generates a valid multi-page PDF for long quotations", async () => {
    await signInAs("SALES");
    const items = Array.from({ length: 45 }, (_, i) => ({ description: `Line item number ${i + 1} with a reasonably long description that wraps across the available width of the column`, quantity: "2", unitPrice: "19.99" }));
    const r = await createQuotation(input({ items }));
    const pdf = await buildQuotationPdf((await loadQuotationForPdf((r as { id: string }).id))!);
    expect(Buffer.from(pdf.slice(0, 5)).toString()).toBe("%PDF-");
    expect((await PDFDocument.load(pdf)).getPageCount()).toBeGreaterThan(1);
  });

  it("handles non-Latin characters in the PDF without crashing", async () => {
    await signInAs("SALES");
    const r = await createQuotation(input({ clientName: "Tendai ✓ 中文", items: [{ description: "Panel ≥ 400V 🚀", quantity: "1", unitPrice: "10" }] }));
    expect(r.ok).toBe(true);
    const pdf = await buildQuotationPdf((await loadQuotationForPdf((r as { id: string }).id))!);
    expect(pdf.length).toBeGreaterThan(1000);
  });

  it("enforces role permissions on every quotation operation", async () => {
    await signInAs("EDITOR");
    await expect(createQuotation(input())).rejects.toMatchObject({ code: "FORBIDDEN" });
    signOut();
    await expect(createQuotation(input())).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    await signInAs("SALES");
    const r = await createQuotation(input());
    signOut();
    await signInAs("EDITOR");
    await expect(sendQuotation((r as { id: string }).id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(updateQuotation((r as { id: string }).id, input())).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
