import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";
import { Badge, LinkButton, PageTitle } from "@/components/admin/shell";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesAdmin() {
  const user = await requirePage("content:read");
  const items = await db().service.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, title: true, slug: true, status: true, updatedAt: true } });
  return (
    <>
      <PageTitle title="Services">{can(user.role, "content:write") && <LinkButton href="/admin/services/new">New service</LinkButton>}</PageTitle>
      <ul className="divide-y divide-steel-200 border border-steel-300 bg-white">
        {items.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <Link href={`/admin/services/${s.id}`} className="font-bold text-navy-900 underline decoration-accent decoration-2 underline-offset-4">{s.title}</Link>
            <span className="text-xs text-steel-500">/services/{s.slug}</span>
            <Badge tone={s.status === "PUBLISHED" ? "green" : "grey"}>{s.status}</Badge>
          </li>
        ))}
      </ul>
    </>
  );
}
