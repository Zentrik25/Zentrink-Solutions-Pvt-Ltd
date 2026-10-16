import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/auth/session";
import { listEnquiries } from "@/lib/enquiry/admin";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/enquiry/workflow";
import { PageTitle, Badge } from "@/components/admin/shell";

export const metadata: Metadata = { title: "Enquiries" };

type Props = { searchParams: Promise<{ status?: string; assignee?: string; q?: string; page?: string }> };

const tone = (s: string) => (s === "NEW" ? "orange" : s === "WON" ? "green" : s === "LOST" ? "red" : s === "CLOSED" ? "grey" : "navy");

export default async function EnquiriesPage({ searchParams }: Props) {
  await requirePage("enquiries:read");
  const sp = await searchParams;
  const { items, total, page, pages } = await listEnquiries({
    status: sp.status,
    assignee: sp.assignee,
    q: sp.q,
    page: Number.parseInt(sp.page ?? "1", 10) || 1,
  });
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.status) u.set("status", sp.status);
    if (sp.assignee) u.set("assignee", sp.assignee);
    if (sp.q) u.set("q", sp.q);
    if (p > 1) u.set("page", String(p));
    return `?${u}`;
  };

  return (
    <>
      <PageTitle title="Enquiry inbox" />
      <form className="mb-6 grid gap-3 border border-steel-300 bg-white p-4 sm:grid-cols-[1fr_12rem_12rem_auto]">
        <input name="q" defaultValue={sp.q} placeholder="Search reference, name, company, email" aria-label="Search enquiries" className="border-2 border-steel-300 px-3 py-2 text-sm" />
        <select name="status" defaultValue={sp.status ?? ""} aria-label="Status" className="border-2 border-steel-300 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <select name="assignee" defaultValue={sp.assignee ?? ""} aria-label="Assignee" className="border-2 border-steel-300 px-3 py-2 text-sm">
          <option value="">Anyone</option>
          <option value="me">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
        </select>
        <button className="border-2 border-navy-900 bg-navy-900 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white">Filter</button>
      </form>

      <p className="mb-3 text-sm text-steel-600">{total} enquir{total === 1 ? "y" : "ies"}</p>
      <div className="overflow-x-auto border border-steel-300 bg-white">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="bg-steel-100 text-xs uppercase tracking-wider text-steel-600">
            <tr>
              <th className="p-3">Reference</th><th className="p-3">Client</th><th className="p-3">Service</th>
              <th className="p-3">Status</th><th className="p-3">Assigned</th><th className="p-3">Received</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className="border-t border-steel-200 hover:bg-steel-50">
                <td className="p-3 font-bold">
                  <Link href={`/admin/enquiries/${e.id}`} className="text-navy-900 underline decoration-accent decoration-2 underline-offset-4">{e.reference}</Link>
                </td>
                <td className="p-3">{e.name}{e.company ? <span className="block text-xs text-steel-500">{e.company}</span> : null}</td>
                <td className="p-3">{e.serviceLabel}</td>
                <td className="p-3"><Badge tone={tone(e.status)}>{STATUS_LABEL[e.status]}</Badge></td>
                <td className="p-3">{e.assignedTo?.name ?? <span className="text-steel-500">Unassigned</span>}</td>
                <td className="p-3 whitespace-nowrap">{e.createdAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-steel-500">No enquiries match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex gap-2">
          {page > 1 && <Link href={qs(page - 1)} className="border-2 border-steel-300 px-4 py-2 text-sm font-bold">Previous</Link>}
          <span className="px-3 py-2 text-sm">Page {page} of {pages}</span>
          {page < pages && <Link href={qs(page + 1)} className="border-2 border-steel-300 px-4 py-2 text-sm font-bold">Next</Link>}
        </nav>
      )}
    </>
  );
}
