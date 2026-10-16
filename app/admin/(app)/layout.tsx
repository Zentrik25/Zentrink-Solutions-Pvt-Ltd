import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requirePage } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/shell";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requirePage();
  return <AdminShell user={user}>{children}</AdminShell>;
}
