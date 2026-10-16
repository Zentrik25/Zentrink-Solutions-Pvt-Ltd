"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Mail, Menu, Phone, X } from "lucide-react";
import { NAV, SITE } from "@/lib/site";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
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
    <header className="sticky top-0 z-50 border-b border-steel-200 bg-white">
      <div className="hidden bg-navy-950 text-xs text-steel-300 lg:block">
        <Container className="flex h-9 items-center justify-between">
          <p className="uppercase tracking-[0.18em]">
            Electrical engineering &middot; Zimbabwe
          </p>
          <div className="flex items-center gap-6">
            <a href={SITE.phoneHref} className="flex items-center gap-2 hover:text-white">
              <Phone aria-hidden className="size-3.5" />
              {SITE.phone}
            </a>
            <a href={`mailto:${SITE.email}`} className="flex items-center gap-2 hover:text-white">
              <Mail aria-hidden className="size-3.5" />
              {SITE.email}
            </a>
          </div>
        </Container>
      </div>

      <Container className="flex h-[4.5rem] items-center justify-between">
        <Link href="/" aria-label={`${SITE.shortName} home`}>
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "border-b-2 px-3 py-2 text-sm font-bold uppercase tracking-wider transition-colors",
                  active
                    ? "border-accent text-navy-900"
                    : "border-transparent text-charcoal-700 hover:border-steel-300 hover:text-navy-900",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <ButtonLink href="/request-a-quote" className="ml-4 px-5 py-2.5">
            Request a Quote
          </ButtonLink>
        </nav>

        <button
          type="button"
          className="flex size-11 items-center justify-center border-2 border-navy-900 text-navy-900 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpenPath(open ? null : pathname)}
        >
          {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        </button>
      </Container>

      {open && (
        <div
          id="mobile-nav"
          className="fixed inset-x-0 top-[4.5rem] bottom-0 overflow-y-auto border-t border-steel-200 bg-white lg:hidden"
        >
          <nav aria-label="Mobile" className="px-5 py-6 sm:px-8">
            <ul className="border-t border-steel-200">
              <li className="border-b border-steel-200">
                <Link
                  href="/"
                  aria-current={pathname === "/" ? "page" : undefined}
                  className="block py-4 text-lg font-bold uppercase tracking-wider text-navy-900"
                >
                  Home
                </Link>
              </li>
              {NAV.map((item) => (
                <li key={item.href} className="border-b border-steel-200">
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className={cn(
                      "block py-4 text-lg font-bold uppercase tracking-wider",
                      isActive(pathname, item.href) ? "text-accent-strong" : "text-navy-900",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3">
              <ButtonLink href="/request-a-quote">Request a Project Quote</ButtonLink>
              <a
                href={SITE.phoneHref}
                className="flex items-center justify-center gap-2 border-2 border-navy-900 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-navy-900"
              >
                <Phone aria-hidden className="size-4" />
                {SITE.phone}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
