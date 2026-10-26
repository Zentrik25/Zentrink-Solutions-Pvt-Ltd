import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { NAV, SITE, whatsappLink, WHATSAPP_DEFAULT_MESSAGE } from "@/lib/site";
import { getContact, getIndustries, getServices } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { CookieSettings } from "@/components/analytics/cookie-settings";

const link = "text-white/70 transition-colors hover:text-white";
const heading = "t-label mb-5 text-white/50";

export async function Footer() {
  const [SERVICES, INDUSTRIES, contact] = await Promise.all([getServices(), getIndustries(), getContact()]);
  return (
    <footer className="bg-navy-950 text-white">
      <Container className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Link href="/" aria-label={`${SITE.shortName} home`} className="inline-block">
            <Logo tone="light" />
          </Link>
          <p className="mt-6 max-w-sm text-[0.9375rem] leading-relaxed text-white/70">{SITE.description}</p>
        </div>

        <nav aria-label="Services">
          <h2 className={heading}>Services</h2>
          <ul className="space-y-3 text-sm">
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className={link}>
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company">
          <h2 className={heading}>Company</h2>
          <ul className="space-y-3 text-sm">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className={link}>
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/request-a-quote" className={link}>
                Request a Quote
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className={heading}>Contact</h2>
          <ul className="space-y-4 text-sm text-white/70">
            <li className="flex gap-3">
              <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
              <a href={contact.phoneHref} className="tnum hover:text-white">
                {contact.phone}
              </a>
            </li>
            <li className="flex gap-3">
              <MessageCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
              <a
                href={whatsappLink(WHATSAPP_DEFAULT_MESSAGE, contact.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                WhatsApp
              </a>
            </li>
            <li className="flex gap-3">
              <Mail aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
              <a href={contact.mailto} className="break-all hover:text-white">
                {contact.email}
              </a>
            </li>
            <li className="flex gap-3">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>Serving projects across {SITE.country}</span>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="grid gap-6 py-8 text-sm text-white/55 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <h2 className="t-label mb-3 text-white/50">Industries served</h2>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {INDUSTRIES.map((i) => (
                <li key={i.slug}>
                  <Link href={`/industries/${i.slug}`} className="hover:text-white">
                    {i.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:text-right">
            <p>
              &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
            </p>
            <p className="mt-2 flex flex-wrap gap-5 lg:justify-end">
              <Link href="/privacy-policy" className="hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms-of-use" className="hover:text-white">
                Terms of Use
              </Link>
              <CookieSettings className="hover:text-white" />
            </p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
