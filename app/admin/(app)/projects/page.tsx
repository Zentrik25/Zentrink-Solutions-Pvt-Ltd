import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";
import { Badge, LinkButton, PageTitle } from "@/components/admin/shell";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsAdmin() {
  const user = await requirePage("content:read");
  const items = await db().project.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, title: true, category: true, status: true, featured: true } });
  return (
    <>
      <PageTitle title="Projects">{can(user.role, "content:write") && <LinkButton href="/admin/projects/new">New project</LinkButton>}</PageTitle>
      <p className="mb-4 max-w-2xl text-sm text-steel-600">Only publish projects that are completed and verified. A project needs at least one gallery image before it can go live.</p>
      <ul className="divide-y divide-steel-200 border border-steel-300 bg-white">
        {items.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <Link href={`/admin/projects/${p.id}`} className="font-bold text-navy-900 underline decoration-accent decoration-2 underline-offset-4">{p.title}</Link>
            <span className="text-xs text-steel-500">{p.category}{p.featured ? " · Featured" : ""}</span>
            <Badge tone={p.status === "PUBLISHED" ? "green" : "grey"}>{p.status}</Badge>
          </li>
        ))}
        {items.length === 0 && <li className="p-8 text-center text-steel-500">No projects yet.</li>}
      </ul>
    </>
  );
}
