import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";
import { pairsToText, toLines } from "@/lib/content/parse";
import { ActionForm, CheckboxGroup, TextArea, TextInput } from "@/components/admin/form";
import { SeoFields, StatusField } from "@/components/admin/status-seo";
import { DeleteButton } from "@/components/admin/delete-button";
import { PageTitle } from "@/components/admin/shell";
import { deleteContentAction, saveContentAction } from "../../content-actions";

export const metadata: Metadata = { title: "Edit industry" };

export default async function IndustryEditor({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage("content:read");
  const { id } = await params;
  const isNew = id === "new";
  const [ind, services] = await Promise.all([
    isNew ? null : db().industry.findUnique({ where: { id }, include: { services: { select: { slug: true } } } }),
    db().service.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, title: true } }),
  ]);
  if (!isNew && !ind) notFound();
  return (
    <>
      <PageTitle title={isNew ? "New industry" : ind!.title} />
      <div className="max-w-4xl border border-steel-300 bg-white p-6">
        <ActionForm action={saveContentAction.bind(null, "industry", id)}>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput name="title" label="Title" defaultValue={ind?.title} required />
            <TextInput name="slug" label="URL slug" defaultValue={ind?.slug} hint="Used in /industries/your-slug" required />
          </div>
          <TextArea name="summary" label="Summary" defaultValue={ind?.summary} rows={4} />
          <TextArea name="challenges" label="Sector challenges" defaultValue={ind ? toLines(ind.challenges) : ""} rows={5} hint="One per line." />
          <TextArea name="needs" label="Typical electrical needs" defaultValue={ind ? toLines(ind.needs) : ""} rows={5} hint="One per line." />
          <TextArea name="approach" label="Our approach" defaultValue={ind ? toLines(ind.approach) : ""} rows={4} hint="One per line." />
          <TextArea name="faqs" label="FAQs" defaultValue={ind ? pairsToText((ind.faqs as { q: string; a: string }[]).map((f) => [f.q, f.a])) : ""} rows={5} hint="One per line: Question | Answer" />
          <CheckboxGroup name="services" label="Relevant services" selected={ind?.services.map((s) => s.slug) ?? []} options={services.map((s) => ({ value: s.slug, label: s.title }))} />
          <TextInput name="sortOrder" label="Order" type="number" defaultValue={ind?.sortOrder ?? 0} />
          <StatusField value={ind?.status ?? "DRAFT"} />
          <SeoFields title={ind?.seoTitle} description={ind?.seoDescription} />
        </ActionForm>
        {!isNew && can(user.role, "content:publish") && <div className="mt-8 border-t border-steel-200 pt-6"><DeleteButton action={deleteContentAction.bind(null, "industry", id)} /></div>}
      </div>
    </>
  );
}
