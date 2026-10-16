import type { ReactNode } from "react";
import { SITE } from "@/lib/site";
import { getContact } from "@/lib/data";
import { Header } from "./header";
import { Footer } from "./footer";

export async function SiteChrome({ children }: { children: ReactNode }) {
  const contact = await getContact();
  const organisationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    email: contact.email,
    telephone: contact.phone,
    description: SITE.description,
    areaServed: { "@type": "Country", name: SITE.country },
  };
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-accent focus:px-4 focus:py-3 focus:font-bold focus:text-navy-950"
      >
        Skip to main content
      </a>
      <Header contact={{ phone: contact.phone, phoneHref: contact.phoneHref, email: contact.email }} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationJsonLd) }} />
    </>
  );
}
