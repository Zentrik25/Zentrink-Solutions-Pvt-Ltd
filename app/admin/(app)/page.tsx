import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";
import { STATUS_LABEL } from "@/lib/enquiry/workflow";
import { Badge, Panel, PageTitle } from "@/components/admin/shell";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requirePage();
  const { denied } = await searchParams;
  const showEnquiries = can(user.role, "enquiries:read");
  const showContent = can(user.role, "content:read");

  const [byStatus, recent, failedMail, draftCounts] = await Promise.all([
    showEnquiries ? db().enquiry.groupBy({ by: ["status"], _count: { _all: true } }) : [],
    showEnquiries ? db().enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, reference: true, name: true, serviceLabel: true, status: true, createdAt: true } }) : [],
    showEnquiries ? db().emailNotification.count({ where: { status: { in: ["FAILED", "PENDING"] }, attempts: { gt: 0 } } }) : 0,
    showContent
      ? Promise.all([db().service.count({ where: { status: "DRAFT" } }), db().project.count({ where: { status: "DRAFT" } }), db().article.count({ where: { status: "DRAFT" } })])
      : [0, 0, 0],
  ]);
  const count = (s: string) => byStatus.find((b) => b.status === s)?._count._all ?? 0;

  return (
    <>
      <PageTitle title={`Welcome, ${user.name}`} />
      {denied && <p role="alert" className="mb-6 border-l-4 border-red-700 bg-red-50 p-3 text-sm font-semibold text-red-800">You do not have access to that area.</p>}
      {showEnquiries && (
        <>
          <ul className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[["New", count("NEW")], ["Under review", count("UNDER_REVIEW")], ["Quotation stage", count("QUOTATION_PREPARED") + count("QUOTATION_SENT")], ["Won", count("WON")]].map(([l, n]) => (
              <li key={l as string} className="border border-steel-300 border-t-4 border-t-navy-900 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-steel-500">{l}</p>
                <p className="mt-2 font-display text-3xl font-black text-navy-900">{n}</p>
              </li>
            ))}
          </ul>
          {failedMail > 0 && (
            <p className="mb-6 border-l-4 border-accent bg-steel-100 p-3 text-sm">
              {failedMail} email notification{failedMail === 1 ? " has" : "s have"} not been delivered yet. They are retried automatically; open the enquiry to see the error.
            </p>
          )}
          <Panel title="Latest enquiries">
            <ul className="divide-y divide-steel-200 text-sm">
              {recent.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <Link href={`/admin/enquiries/${e.id}`} className="font-bold text-navy-900 underline decoration-accent decoration-2 underline-offset-4">{e.reference}</Link>
                  <span>{e.name} &middot; {e.serviceLabel}</span>
                  <Badge tone={e.status === "NEW" ? "orange" : "navy"}>{STATUS_LABEL[e.status]}</Badge>
                </li>
              ))}
              {recent.length === 0 && <li className="py-6 text-center text-steel-500">No enquiries yet.</li>}
            </ul>
          </Panel>
        </>
      )}
      {showContent && (
        <p className="mt-8 text-sm text-steel-600">
          Drafts awaiting publication: {draftCounts[0]} service(s), {draftCounts[1]} project(s), {draftCounts[2]} article(s).
        </p>
      )}
    </>
  );
}
