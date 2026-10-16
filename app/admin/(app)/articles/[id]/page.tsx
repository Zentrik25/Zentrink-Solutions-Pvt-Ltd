import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";
import { bodyToText } from "@/lib/content/parse";
import type { Block } from "@/lib/articles";
import { ActionForm, Select, TextArea, TextInput } from "@/components/admin/form";
import { SeoFields, StatusField } from "@/components/admin/status-seo";
import { DeleteButton } from "@/components/admin/delete-button";
import { PageTitle } from "@/components/admin/shell";
import { deleteContentAction, saveContentAction } from "../../content-actions";

export const metadata: Metadata = { title: "Edit article" };

export default async function ArticleEditor({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage("content:read");
  const { id } = await params;
  const isNew = id === "new";
  const [a, categories, media] = await Promise.all([
    isNew ? null : db().article.findUnique({ where: { id } }),
    db().articleCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db().media.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, filename: true }, take: 200 }),
  ]);
  if (!isNew && !a) notFound();
  return (
    <>
      <PageTitle title={isNew ? "New article" : a!.title} />
      <div className="max-w-4xl border border-steel-300 bg-white p-6">
        <ActionForm action={saveContentAction.bind(null, "article", id)}>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput name="title" label="Title" defaultValue={a?.title} required />
            <TextInput name="slug" label="URL slug" defaultValue={a?.slug} required />
            <Select name="categoryId" label="Category" defaultValue={a?.categoryId ?? ""} placeholder="Choose a category" options={categories.map((c) => ({ value: c.id, label: c.name }))} />
            <Select name="coverImageId" label="Cover image (optional)" defaultValue={a?.coverImageId ?? ""} placeholder="None" options={media.map((m) => ({ value: m.id, label: m.filename }))} />
          </div>
          <TextArea name="excerpt" label="Excerpt" defaultValue={a?.excerpt} rows={3} />
          <TextArea name="body" label="Body" defaultValue={a ? bodyToText(a.body as Block[]) : ""} rows={20} hint="Use '## ' for headings, '- ' for bullet points, and a blank line between paragraphs." />
          <StatusField value={a?.status ?? "DRAFT"} />
          <SeoFields title={a?.seoTitle} description={a?.seoDescription} />
        </ActionForm>
        {!isNew && can(user.role, "content:publish") && <div className="mt-8 border-t border-steel-200 pt-6"><DeleteButton action={deleteContentAction.bind(null, "article", id)} /></div>}
      </div>
    </>
  );
}
