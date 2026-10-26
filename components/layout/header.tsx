"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { NAV, SITE } from "@/lib/site";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type HeaderContact = { phone: string; phoneHref: string; email: string };

export function Header({ contact }: { contact: HeaderContact }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  // The menu is open only for the page it was opened on, so navigating closes it.
  const open = openPath === pathname;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenPath(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-steel-200 bg-white/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label={`${SITE.shortName} home`} className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  active ? "bg-steel-100 text-navy-950" : "text-navy-950/80 hover:bg-steel-50 hover:text-navy-950",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <a href={contact.phoneHref} className="flex items-center gap-2 text-sm text-navy-950/80 hover:text-navy-950">
            <Phone aria-hidden className="size-4 text-accent-strong" />
            <span className="tnum">{contact.phone}</span>
          </a>
          <ButtonLink href="/request-a-quote" className="min-h-10 px-4 py-2 text-sm">
            Request a Quote
          </ButtonLink>
        </div>

        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-md border border-steel-200 text-navy-950 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpenPath(open ? null : pathname)}
        >
          {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        </button>
      </Container>

      {open && (
        <div id="mobile-nav" className="absolute inset-x-0 top-full h-[calc(100dvh-4rem)] overflow-y-auto border-t border-steel-200 bg-white lg:hidden">
          <nav aria-label="Mobile" className="px-5 py-6 sm:px-8">
            <ul className="divide-y divide-steel-200 border-y border-steel-200">
              <li>
                <Link
                  href="/"
                  aria-current={pathname === "/" ? "page" : undefined}
                  className="block py-4 text-lg text-navy-950"
                >
                  Home
                </Link>
              </li>
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className={cn("block py-4 text-lg", isActive(pathname, item.href) ? "text-accent-strong" : "text-navy-950")}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3">
              <ButtonLink href="/request-a-quote">Request a Project Quote</ButtonLink>
              <a
                href={contact.phoneHref}
                className="flex min-h-11 items-center justify-center gap-2 rounded-sm border border-steel-300 px-5 py-2.5 text-[0.9375rem] text-navy-950"
              >
                <Phone aria-hidden className="size-4" />
                {contact.phone}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
