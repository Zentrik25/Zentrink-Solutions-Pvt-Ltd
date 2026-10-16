import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { NAV, SITE, whatsappLink, WHATSAPP_DEFAULT_MESSAGE } from "@/lib/site";
import { SERVICES } from "@/lib/services";
import { INDUSTRIES } from "@/lib/industries";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";

const linkClass = "text-steel-300 hover:text-white";
const headingClass = "mb-5 text-xs font-bold uppercase tracking-[0.2em] text-accent";

export function Footer() {
  return (
    <footer className="bg-charcoal-900 text-white">
      <Container className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        <div>
          <Link href="/" aria-label={`${SITE.shortName} home`}>
            <Logo tone="light" />
          </Link>
          <p className="mt-6 max-w-sm leading-relaxed text-steel-300">
            {SITE.description}
          </p>
        </div>

        <nav aria-label="Services">
          <h2 className={headingClass}>Services</h2>
          <ul className="space-y-3 text-sm">
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className={linkClass}>
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid gap-12">
          <nav aria-label="Company">
            <h2 className={headingClass}>Company</h2>
            <ul className="space-y-3 text-sm">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className={linkClass}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div>
          <h2 className={headingClass}>Contact</h2>
          <ul className="space-y-4 text-sm text-steel-300">
            <li className="flex gap-3">
              <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
              <a href={SITE.phoneHref} className="hover:text-white">
                {SITE.phone}
              </a>
            </li>
            <li className="flex gap-3">
              <MessageCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
              <a
                href={whatsappLink(WHATSAPP_DEFAULT_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                WhatsApp
              </a>
            </li>
            <li className="flex gap-3">
              <Mail aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
              <a href={`mailto:${SITE.email}`} className="break-all hover:text-white">
                {SITE.email}
              </a>
            </li>
            <li className="flex gap-3">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>Serving projects across {SITE.country}</span>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-charcoal-700">
        <Container className="grid gap-6 py-8 text-sm text-steel-400 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-steel-300">
              Industries served
            </h2>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {INDUSTRIES.map((i) => (
                <li key={i.slug}>
                  <Link href={`/industries#${i.slug}`} className="hover:text-white">
                    {i.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <p className="lg:text-right">
            &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
        </Container>
      </div>
    </footer>
  );
}
