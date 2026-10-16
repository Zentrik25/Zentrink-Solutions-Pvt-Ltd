import Link from "next/link";
import type { ReactNode } from "react";
import { can, type Permission } from "@/lib/auth/permissions";
import type { SessionUser } from "@/lib/auth/session";
import { logoutAction } from "@/app/admin/actions";

const NAV: { label: string; href: string; perm: Permission }[] = [
  { label: "Dashboard", href: "/admin", perm: "content:read" },
  { label: "Enquiries", href: "/admin/enquiries", perm: "enquiries:read" },
  { label: "Quotations", href: "/admin/quotations", perm: "quotations:read" },
  { label: "Services", href: "/admin/services", perm: "content:read" },
  { label: "Industries", href: "/admin/industries", perm: "content:read" },
  { label: "Projects", href: "/admin/projects", perm: "content:read" },
  { label: "Articles", href: "/admin/articles", perm: "content:read" },
  { label: "Media", href: "/admin/media", perm: "media:write" },
  { label: "Settings", href: "/admin/settings", perm: "settings:write" },
  { label: "Users", href: "/admin/users", perm: "users:manage" },
];

export function AdminShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const items = NAV.filter((n) => can(user.role, n.perm));
  return (
    <div className="min-h-screen bg-steel-100 lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="bg-navy-950 text-white lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 lg:block">
          <Link href="/admin" className="font-display text-lg font-extrabold uppercase tracking-wide">
            Zentrik <span className="text-accent">Admin</span>
          </Link>
          <p className="mt-1 hidden text-xs text-steel-400 lg:block">{user.name} &middot; {user.role.replace("_", " ")}</p>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-6">
          {items.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap px-3 py-2 text-sm font-bold uppercase tracking-wider text-steel-300 hover:bg-navy-800 hover:text-white">
              {n.label}
            </Link>
          ))}
          <Link href="/" target="_blank" className="whitespace-nowrap px-3 py-2 text-sm font-bold uppercase tracking-wider text-steel-400 hover:text-white">
            View site
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="w-full px-3 py-2 text-left text-sm font-bold uppercase tracking-wider text-steel-400 hover:text-white">
              Sign out
            </button>
          </form>
        </nav>
      </aside>
      <main className="min-w-0 p-5 sm:p-8">{children}</main>
    </div>
  );
}

export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-extrabold uppercase text-navy-900 sm:text-3xl">{title}</h1>
      {children && <div className="flex gap-3">{children}</div>}
    </div>
  );
}

export function Panel({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`border border-steel-300 bg-white p-5 sm:p-6 ${className ?? ""}`}>
      {title && <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-steel-500">{title}</h2>}
      {children}
    </section>
  );
}

export function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="border-2 border-navy-900 bg-navy-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-navy-700">
      {children}
    </Link>
  );
}

export function Badge({ children, tone = "grey" }: { children: ReactNode; tone?: "grey" | "orange" | "navy" | "green" | "red" }) {
  const tones = {
    grey: "bg-steel-200 text-charcoal-800",
    orange: "bg-accent text-navy-950",
    navy: "bg-navy-900 text-white",
    green: "bg-emerald-700 text-white",
    red: "bg-red-700 text-white",
  };
  return <span className={`inline-block px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${tones[tone]}`}>{children}</span>;
}
