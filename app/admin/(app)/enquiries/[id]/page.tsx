import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { getEnquiryDetail } from "@/lib/enquiry/admin";
import { allowedTransitions, STATUS_LABEL } from "@/lib/enquiry/workflow";
import { budgetLabel } from "@/lib/enquiry/constants";
import { db } from "@/lib/server/db";
import { formatMoney } from "@/lib/quotation/math";
import { ActionForm, Select, TextArea, TextInput } from "@/components/admin/form";
import { Badge, LinkButton, Panel, PageTitle } from "@/components/admin/shell";
import { addNoteAction, assignAction, changeStatusAction } from "../actions";

export const metadata: Metadata = { title: "Enquiry" };

type Props = { params: Promise<{ id: string }> };

const fmt = (d: Date) => d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
const kb = (n: number) => `${Math.max(1, Math.round(n / 1024))} KB`;

export default async function EnquiryPage({ params }: Props) {
  const user = await requirePage("enquiries:read");
  const { id } = await params;
  const e = await getEnquiryDetail(id);
  if (!e) notFound();
  const staff = can(user.role, "enquiries:assign")
    ? await db().adminUser.findMany({ where: { active: true, role: { in: ["SUPER_ADMIN", "ADMIN", "SALES"] } }, select: { id: true, name: true }, orderBy: { name: "asc" } })
    : [];
  const canWrite = can(user.role, "enquiries:write");
  const next = allowedTransitions(e.status);

  return (
    <>
      <PageTitle title={e.reference}>
        {can(user.role, "quotations:write") && <LinkButton href={`/admin/quotations/new?enquiry=${e.id}`}>Create quotation</LinkButton>}
      </PageTitle>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Panel title="Client">
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {[
                ["Name", e.name], ["Company", e.company], ["Email", e.email], ["Phone", e.phone],
                ["Service", e.serviceLabel], ["Location", e.location], ["Budget (USD)", budgetLabel(e.budgetRange)],
                ["Preferred start", e.preferredStart?.toISOString().slice(0, 10)], ["Received", fmt(e.createdAt)],
                ["Consent", `Given ${fmt(e.consentAt)}`],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k as string}><dt className="text-xs font-bold uppercase tracking-wider text-steel-500">{k}</dt><dd className="mt-0.5 break-words font-semibold">{v}</dd></div>
              ))}
            </dl>
          </Panel>
          <Panel title="Project description"><p className="whitespace-pre-wrap leading-relaxed">{e.description}</p></Panel>
          <Panel title={`Supporting documents (${e.attachments.length})`}>
            {e.attachments.length === 0 ? <p className="text-sm text-steel-500">No documents attached.</p> : (
              <ul className="divide-y divide-steel-200 text-sm">
                {e.attachments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-4 py-2">
                    <span className="break-all font-semibold">{a.filename} <span className="font-normal text-steel-500">({kb(a.size)})</span></span>
                    <a href={`/admin/enquiries/${e.id}/attachments/${a.id}`} className="shrink-0 font-bold text-accent-strong underline">Download</a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Internal notes">
            {canWrite && (
              <ActionForm action={addNoteAction.bind(null, e.id)} submitLabel="Add note" className="mb-6">
                <TextArea name="body" label="New note" rows={3} maxLength={4000} />
              </ActionForm>
            )}
            <ul className="space-y-4">
              {e.notes.map((n) => (
                <li key={n.id} className="border-l-4 border-steel-300 pl-4 text-sm">
                  <p className="whitespace-pre-wrap">{n.body}</p>
                  <p className="mt-1 text-xs text-steel-500">{n.author?.name ?? "Unknown"} &middot; {fmt(n.createdAt)}</p>
                </li>
              ))}
              {e.notes.length === 0 && <li className="text-sm text-steel-500">No notes yet.</li>}
            </ul>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Status">
            <p className="mb-4"><Badge tone="orange">{STATUS_LABEL[e.status]}</Badge></p>
            {canWrite && next.length > 0 && (
              <ActionForm action={changeStatusAction.bind(null, e.id)} submitLabel="Update status">
                <Select name="status" label="Move to" options={next.map((s) => ({ value: s, label: STATUS_LABEL[s] }))} />
                <TextInput name="note" label="Note (optional)" maxLength={500} />
              </ActionForm>
            )}
          </Panel>
          {can(user.role, "enquiries:assign") && (
            <Panel title="Assignment">
              <ActionForm action={assignAction.bind(null, e.id)} submitLabel="Save assignment">
                <Select name="assignee" label="Assigned to" defaultValue={e.assignedTo?.id ?? ""} placeholder="Unassigned" options={staff.map((s) => ({ value: s.id, label: s.name }))} />
              </ActionForm>
            </Panel>
          )}
          <Panel title="Quotations">
            <ul className="space-y-2 text-sm">
              {e.quotations.map((q) => (
                <li key={q.id} className="flex justify-between gap-3">
                  <Link href={`/admin/quotations/${q.id}`} className="font-bold text-navy-900 underline">{q.reference}</Link>
                  <span>{formatMoney(q.total.toString())} <Badge>{q.status}</Badge></span>
                </li>
              ))}
              {e.quotations.length === 0 && <li className="text-steel-500">None yet.</li>}
            </ul>
          </Panel>
          <Panel title="Email notifications">
            <ul className="space-y-2 text-sm">
              {e.notifications.map((n) => (
                <li key={n.id}>
                  <Badge tone={n.status === "SENT" ? "green" : n.status === "FAILED" ? "red" : "grey"}>{n.status}</Badge>{" "}
                  {n.kind === "ENQUIRY_COMPANY" ? "Company notification" : n.kind === "ENQUIRY_ACKNOWLEDGEMENT" ? "Client acknowledgement" : "Quotation"}
                  {n.lastError && n.status !== "SENT" && <span className="block text-xs text-red-700">{n.lastError}</span>}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Status history">
            <ol className="space-y-3 text-sm">
              {e.history.map((h) => (
                <li key={h.id}>
                  <strong>{h.fromStatus ? `${STATUS_LABEL[h.fromStatus]} → ` : ""}{STATUS_LABEL[h.toStatus]}</strong>
                  <span className="block text-xs text-steel-500">{h.changedBy?.name ?? "System"} &middot; {fmt(h.createdAt)}</span>
                  {h.note && <span className="block text-xs">{h.note}</span>}
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </>
  );
}
