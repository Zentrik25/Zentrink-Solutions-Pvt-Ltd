import type { ReactNode } from "react";
import { SITE } from "@/lib/site";
import { getContact } from "@/lib/data";
import { absoluteUrl, jsonLd } from "@/lib/seo";
import { Analytics } from "@/components/analytics/analytics";
import { Header } from "./header";
import { Footer } from "./footer";

export async function SiteChrome({ children }: { children: ReactNode }) {
  const contact = await getContact();
  const hasAddress = contact.address.trim().length > 0;

  // Only verified facts are published. A LocalBusiness entity (which implies a place
  // customers can find) is emitted ONLY when a real address has been entered in Settings.
  const organisation = {
    "@context": "https://schema.org",
    "@type": hasAddress ? ["Organization", "LocalBusiness"] : "Organization",
    "@id": `${absoluteUrl("/")}#organization`,
    name: SITE.name,
    legalName: SITE.name,
    url: SITE.url,
    logo: absoluteUrl("/logo.png"),
    description: SITE.description,
    email: contact.email,
    telephone: contact.phone,
    areaServed: { "@type": "Country", name: SITE.country },
    knowsAbout: [
      "Electrical installations",
      "Power distribution",
      "Solar energy systems",
      "Industrial electrical maintenance",
      "Electrical testing and commissioning",
      "Electrical equipment procurement",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        telephone: contact.phone,
        email: contact.email,
        areaServed: "ZW",
        availableLanguage: ["en"],
      },
    ],
    ...(hasAddress ? { address: { "@type": "PostalAddress", streetAddress: contact.address, addressCountry: "ZW" } } : {}),
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${absoluteUrl("/")}#website`,
    url: SITE.url,
    name: SITE.name,
    publisher: { "@id": `${absoluteUrl("/")}#organization` },
    inLanguage: "en",
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organisation) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(website) }} />
      <Analytics />
    </>
  );
}
