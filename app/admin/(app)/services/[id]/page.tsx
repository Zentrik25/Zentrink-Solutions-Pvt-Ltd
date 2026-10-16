import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/auth/session";
import { db } from "@/lib/server/db";
import { SERVICE_ICONS } from "@/lib/content/admin";
import { pairsToText, toLines, toParagraphs } from "@/lib/content/parse";
import { ActionForm, CheckboxGroup, Select, TextArea, TextInput } from "@/components/admin/form";
import { SeoFields, StatusField } from "@/components/admin/status-seo";
import { DeleteButton } from "@/components/admin/delete-button";
import { PageTitle } from "@/components/admin/shell";
import { can } from "@/lib/auth/permissions";
import { deleteContentAction, saveContentAction } from "../../content-actions";

export const metadata: Metadata = { title: "Edit service" };

export default async function ServiceEditor({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage("content:read");
  const { id } = await params;
  const isNew = id === "new";
  const [service, others, media] = await Promise.all([
    isNew ? null : db().service.findUnique({ where: { id }, include: { related: { select: { slug: true } } } }),
    db().service.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, title: true } }),
    db().media.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, filename: true, alt: true }, take: 200 }),
  ]);
  if (!isNew && !service) notFound();
  const s = service;
  return (
    <>
      <PageTitle title={isNew ? "New service" : s!.title} />
      <div className="max-w-4xl border border-steel-300 bg-white p-6">
        <ActionForm action={saveContentAction.bind(null, "service", id)}>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput name="title" label="Title" defaultValue={s?.title} required />
            <TextInput name="slug" label="URL slug" defaultValue={s?.slug} hint="Used in /services/your-slug" required />
          </div>
          <TextArea name="summary" label="Summary" defaultValue={s?.summary} rows={2} />
          <div className="grid gap-5 sm:grid-cols-3">
            <Select name="icon" label="Icon" defaultValue={s?.icon ?? "plug"} options={SERVICE_ICONS.map((i) => ({ value: i, label: i }))} />
            <TextInput name="sortOrder" label="Order" type="number" defaultValue={s?.sortOrder ?? 0} />
            <Select name="imageId" label="Image" defaultValue={s?.imageId ?? ""} placeholder="Default image" options={media.map((m) => ({ value: m.id, label: m.filename }))} />
          </div>
          <TextArea name="overview" label="Technical overview" defaultValue={s ? toParagraphs(s.overview) : ""} rows={7} hint="Separate paragraphs with a blank line." />
          <TextArea name="scope" label="Scope of services" defaultValue={s ? toLines(s.scope) : ""} rows={7} hint="One item per line." />
          <TextArea name="applications" label="Applications" defaultValue={s ? toLines(s.applications) : ""} rows={5} hint="One item per line." />
          <TextArea name="process" label="Delivery process" defaultValue={s ? pairsToText((s.process as { title: string; text: string }[]).map((p) => [p.title, p.text])) : ""} rows={6} hint="One step per line: Title | Description" />
          <TextArea name="faqs" label="FAQs" defaultValue={s ? pairsToText((s.faqs as { q: string; a: string }[]).map((f) => [f.q, f.a])) : ""} rows={7} hint="One per line: Question | Answer" />
          <CheckboxGroup name="related" label="Related services" selected={s?.related.map((r) => r.slug) ?? []} options={others.filter((o) => o.slug !== s?.slug).map((o) => ({ value: o.slug, label: o.title }))} />
          <StatusField value={s?.status ?? "DRAFT"} />
          <SeoFields title={s?.seoTitle} description={s?.seoDescription} />
        </ActionForm>
        {!isNew && can(user.role, "content:publish") && <div className="mt-8 border-t border-steel-200 pt-6"><DeleteButton action={deleteContentAction.bind(null, "service", id)} /></div>}
      </div>
    </>
  );
}
