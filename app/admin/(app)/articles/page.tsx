import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";
import { ActionForm, TextInput } from "@/components/admin/form";
import { Badge, LinkButton, Panel, PageTitle } from "@/components/admin/shell";
import { saveCategoryAction } from "../content-actions";

export const metadata: Metadata = { title: "Articles" };

export default async function ArticlesAdmin() {
  const user = await requirePage("content:read");
  const [items, categories] = await Promise.all([
    db().article.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, title: true, status: true, category: { select: { name: true } } } }),
    db().articleCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, _count: { select: { articles: true } } } }),
  ]);
  return (
    <>
      <PageTitle title="Articles">{can(user.role, "content:write") && <LinkButton href="/admin/articles/new">New article</LinkButton>}</PageTitle>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ul className="divide-y divide-steel-200 border border-steel-300 bg-white">
          {items.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <Link href={`/admin/articles/${a.id}`} className="font-bold text-navy-900 underline decoration-accent decoration-2 underline-offset-4">{a.title}</Link>
              <span className="text-xs text-steel-500">{a.category.name}</span>
              <Badge tone={a.status === "PUBLISHED" ? "green" : "grey"}>{a.status}</Badge>
            </li>
          ))}
        </ul>
        <Panel title="Categories">
          <ul className="mb-5 space-y-1 text-sm">{categories.map((c) => <li key={c.id}>{c.name} <span className="text-steel-500">({c._count.articles})</span></li>)}</ul>
          {can(user.role, "content:write") && <ActionForm action={saveCategoryAction} submitLabel="Add category"><TextInput name="name" label="New category" maxLength={60} /></ActionForm>}
        </Panel>
      </div>
    </>
  );
}
