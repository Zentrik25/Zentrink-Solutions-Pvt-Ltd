import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";
import { formatMoney } from "@/lib/quotation/math";
import { ActionForm } from "@/components/admin/form";
import { Badge, Panel, PageTitle } from "@/components/admin/shell";
import { QuotationForm } from "@/components/admin/quotation-form";
import { quotationStatusAction, sendQuotationAction, updateQuotationAction } from "../actions";

export const metadata: Metadata = { title: "Quotation" };

type Props = { params: Promise<{ id: string }> };

export default async function QuotationPage({ params }: Props) {
  const user = await requirePage("quotations:read");
  const { id } = await params;
  const q = await db().quotation.findUnique({
    where: { id },
    include: { items: { orderBy: { position: "asc" } }, notifications: { orderBy: { createdAt: "desc" } }, enquiry: { select: { id: true, reference: true } } },
  });
  if (!q) notFound();
  const editable = q.status === "DRAFT" && can(user.role, "quotations:write");

  return (
    <>
      <PageTitle title={q.reference}>
        <a href={`/admin/quotations/${q.id}/pdf`} target="_blank" className="border-2 border-navy-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-navy-900">Download PDF</a>
      </PageTitle>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div>
          {editable ? (
            <div className="border border-steel-300 bg-white p-6">
              <QuotationForm
                action={updateQuotationAction.bind(null, q.id)}
                submitLabel="Save changes"
                defaults={{
                  enquiryId: q.enquiryId ?? undefined,
                  clientName: q.clientName, clientCompany: q.clientCompany ?? "", clientEmail: q.clientEmail,
                  clientPhone: q.clientPhone ?? "", clientAddress: q.clientAddress ?? "", projectTitle: q.projectTitle,
                  taxName: q.taxName, taxRate: q.taxRate.toString(), validUntil: q.validUntil.toISOString().slice(0, 10),
                  terms: q.terms, notes: q.notes ?? "",
                  items: q.items.map((i) => ({ description: i.description, quantity: i.quantity.toString(), unitPrice: i.unitPrice.toString() })),
                }}
              />
            </div>
          ) : (
            <Panel title="Quotation">
              <p className="font-bold">{q.projectTitle}</p>
              <p className="text-sm text-steel-600">{q.clientName}{q.clientCompany ? `, ${q.clientCompany}` : ""} &middot; {q.clientEmail}</p>
              <table className="mt-5 w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-steel-500"><tr><th className="py-2">Item</th><th className="text-right">Qty</th><th className="text-right">Unit</th><th className="text-right">Amount</th></tr></thead>
                <tbody>{q.items.map((i) => (<tr key={i.id} className="border-t border-steel-200"><td className="py-2 pr-3">{i.description}</td><td className="text-right">{Number(i.quantity)}</td><td className="text-right">{formatMoney(i.unitPrice.toString())}</td><td className="text-right">{formatMoney(i.lineTotal.toString())}</td></tr>))}</tbody>
              </table>
              <dl className="mt-4 ml-auto grid max-w-xs grid-cols-2 gap-1 text-sm">
                <dt>Subtotal</dt><dd className="text-right">{formatMoney(q.subtotal.toString())}</dd>
                <dt>{q.taxName} ({Number(q.taxRate)}%)</dt><dd className="text-right">{formatMoney(q.taxAmount.toString())}</dd>
                <dt className="font-bold">Total</dt><dd className="text-right font-bold">{formatMoney(q.total.toString())}</dd>
              </dl>
            </Panel>
          )}
        </div>
        <div className="space-y-6">
          <Panel title="Status">
            <p><Badge tone={q.status === "ACCEPTED" ? "green" : q.status === "REJECTED" ? "red" : "navy"}>{q.status}</Badge></p>
            {q.enquiry && <p className="mt-3 text-sm">Enquiry: <Link href={`/admin/enquiries/${q.enquiry.id}`} className="font-bold underline">{q.enquiry.reference}</Link></p>}
            {q.sentAt && <p className="mt-1 text-xs text-steel-500">First sent {q.sentAt.toISOString().slice(0, 16).replace("T", " ")} UTC</p>}
            {can(user.role, "quotations:send") && (q.status === "DRAFT" || q.status === "SENT") && (
              <div className="mt-5"><ActionForm action={sendQuotationAction.bind(null, q.id)} submitLabel={q.status === "DRAFT" ? "Send to client" : "Resend to client"}><p className="text-xs text-steel-600">Emails the PDF to {q.clientEmail}.</p></ActionForm></div>
            )}
            {can(user.role, "quotations:write") && q.status === "SENT" && (
              <div className="mt-5 flex flex-wrap gap-2">
                {(["ACCEPTED", "REJECTED", "EXPIRED"] as const).map((s) => (
                  <ActionForm key={s} action={quotationStatusAction.bind(null, q.id, s)} submitLabel={`Mark ${s.toLowerCase()}`}><span /></ActionForm>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Email deliveries">
            <ul className="space-y-2 text-sm">
              {q.notifications.map((n) => (
                <li key={n.id}><Badge tone={n.status === "SENT" ? "green" : n.status === "FAILED" ? "red" : "grey"}>{n.status}</Badge> to {n.toEmail}
                  {n.lastError && n.status !== "SENT" && <span className="block text-xs text-red-700">{n.lastError}</span>}</li>
              ))}
              {q.notifications.length === 0 && <li className="text-steel-500">Not sent yet.</li>}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
