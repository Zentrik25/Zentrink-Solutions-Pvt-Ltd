import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";
import { formatMoney } from "@/lib/quotation/math";
import { Badge, LinkButton, PageTitle } from "@/components/admin/shell";

export const metadata: Metadata = { title: "Quotations" };

export default async function QuotationsPage() {
  const user = await requirePage("quotations:read");
  const items = await db().quotation.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, reference: true, clientName: true, projectTitle: true, status: true, total: true, validUntil: true } });
  return (
    <>
      <PageTitle title="Quotations">{can(user.role, "quotations:write") && <LinkButton href="/admin/quotations/new">New quotation</LinkButton>}</PageTitle>
      <div className="overflow-x-auto border border-steel-300 bg-white">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-steel-100 text-xs uppercase tracking-wider text-steel-600"><tr><th className="p-3">Reference</th><th className="p-3">Client</th><th className="p-3">Project</th><th className="p-3">Status</th><th className="p-3 text-right">Total</th><th className="p-3">Valid until</th></tr></thead>
          <tbody>
            {items.map((q) => (
              <tr key={q.id} className="border-t border-steel-200">
                <td className="p-3 font-bold"><Link href={`/admin/quotations/${q.id}`} className="underline decoration-accent decoration-2 underline-offset-4">{q.reference}</Link></td>
                <td className="p-3">{q.clientName}</td><td className="p-3">{q.projectTitle}</td>
                <td className="p-3"><Badge tone={q.status === "ACCEPTED" ? "green" : q.status === "REJECTED" ? "red" : q.status === "SENT" ? "navy" : "grey"}>{q.status}</Badge></td>
                <td className="p-3 text-right">{formatMoney(q.total.toString())}</td><td className="p-3">{q.validUntil.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-steel-500">No quotations yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
