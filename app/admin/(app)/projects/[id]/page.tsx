import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";
import { PROJECT_CATEGORIES } from "@/lib/projects";
import { pairsToText, toParagraphs } from "@/lib/content/parse";
import { ActionForm, Checkbox, CheckboxGroup, Select, TextArea, TextInput } from "@/components/admin/form";
import { SeoFields, StatusField } from "@/components/admin/status-seo";
import { DeleteButton } from "@/components/admin/delete-button";
import { Panel, PageTitle } from "@/components/admin/shell";
import { addProjectImageAction, deleteContentAction, removeProjectImageAction, saveContentAction } from "../../content-actions";

export const metadata: Metadata = { title: "Edit project" };

export default async function ProjectEditor({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage("content:read");
  const { id } = await params;
  const isNew = id === "new";
  const [p, services, media] = await Promise.all([
    isNew ? null : db().project.findUnique({ where: { id }, include: { services: { select: { slug: true } }, images: { include: { media: true }, orderBy: { sortOrder: "asc" } } } }),
    db().service.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, title: true } }),
    db().media.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, filename: true }, take: 200 }),
  ]);
  if (!isNew && !p) notFound();
  return (
    <>
      <PageTitle title={isNew ? "New project" : p!.title} />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="border border-steel-300 bg-white p-6">
          <ActionForm action={saveContentAction.bind(null, "project", id)}>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextInput name="title" label="Title" defaultValue={p?.title} required />
              <TextInput name="slug" label="URL slug" defaultValue={p?.slug} required />
              <Select name="category" label="Category" defaultValue={p?.category ?? PROJECT_CATEGORIES[0]} options={PROJECT_CATEGORIES.map((c) => ({ value: c, label: c }))} />
              <TextInput name="client" label="Client (optional)" defaultValue={p?.client} />
              <TextInput name="location" label="Location" defaultValue={p?.location} required />
              <TextInput name="year" label="Year" defaultValue={p?.year} required />
            </div>
            <TextArea name="summary" label="Summary" defaultValue={p?.summary} rows={3} />
            <TextArea name="description" label="Description" defaultValue={p ? toParagraphs(p.description) : ""} rows={8} hint="Separate paragraphs with a blank line." />
            <TextArea name="specifications" label="Technical specifications" defaultValue={p ? pairsToText((p.specifications as { label: string; value: string }[]).map((s) => [s.label, s.value])) : ""} rows={6} hint="One per line: Label | Value" />
            <CheckboxGroup name="services" label="Services delivered" selected={p?.services.map((s) => s.slug) ?? []} options={services.map((s) => ({ value: s.slug, label: s.title }))} />
            <Checkbox name="featured" label="Feature on the homepage" defaultChecked={p?.featured} />
            <StatusField value={p?.status ?? "DRAFT"} />
            <SeoFields title={p?.seoTitle} description={p?.seoDescription} />
          </ActionForm>
          {!isNew && can(user.role, "content:publish") && <div className="mt-8 border-t border-steel-200 pt-6"><DeleteButton action={deleteContentAction.bind(null, "project", id)} /></div>}
        </div>
        {!isNew && p && (
          <Panel title="Gallery">
            <ul className="mb-6 space-y-4">
              {p.images.map((im) => (
                <li key={im.id} className="border border-steel-200 p-3">
                  <Image src={im.media.url} alt={im.alt || im.media.alt} width={im.media.width ?? 1600} height={im.media.height ?? 1067} sizes="320px" className="aspect-[4/3] w-full object-cover" />
                  <p className="mt-2 text-xs text-steel-600">{im.alt || "No alt text"}</p>
                  <div className="mt-2"><DeleteButton label="Remove" action={removeProjectImageAction.bind(null, p.id, im.id)} /></div>
                </li>
              ))}
              {p.images.length === 0 && <li className="text-sm text-steel-500">No images yet. Upload images in Media, then add them here.</li>}
            </ul>
            <ActionForm action={addProjectImageAction.bind(null, p.id)} submitLabel="Add image">
              <Select name="mediaId" label="Image" placeholder="Choose from media library" options={media.map((m) => ({ value: m.id, label: m.filename }))} />
              <TextInput name="alt" label="Alt text for this image" maxLength={200} />
            </ActionForm>
          </Panel>
        )}
      </div>
    </>
  );
}
