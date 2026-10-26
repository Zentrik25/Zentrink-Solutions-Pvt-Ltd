import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SITE, whatsappLink, WHATSAPP_DEFAULT_MESSAGE } from "@/lib/site";
import { getContact, getServices } from "@/lib/data";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { EnquiryForm } from "@/components/forms/enquiry-form";

export const metadata: Metadata = pageMetadata({
  title: "Contact and Project Enquiries",
  description:
    "Request a project quote from Zentrik Solutions. Call, email, message us on WhatsApp or send a project enquiry.",
  path: "/contact",
});

type Props = { searchParams: Promise<{ service?: string }> };

export default async function ContactPage({ searchParams }: Props) {
  const { service } = await searchParams;
  const [SERVICES, contact] = await Promise.all([getServices(), getContact()]);
  const services = SERVICES;
  const serviceOptions = [...services.map((s) => ({ value: s.slug, label: s.title })), { value: "multiple", label: "Multiple services / not sure yet" }];
  const defaultService = SERVICES.some((s) => s.slug === service) ? service : "";

  const channels = [
    {
      icon: Phone,
      label: "Telephone",
      value: contact.phone,
      href: contact.phoneHref,
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: "Message us on WhatsApp",
      href: whatsappLink(WHATSAPP_DEFAULT_MESSAGE, contact.whatsappNumber),
      external: true,
    },
    {
      icon: Mail,
      label: "Email",
      value: contact.email,
      href: contact.mailto,
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Request a project quote"
        intro="Tell us about your project. The more detail you give about the site, scope and timeline, the faster we can respond with a useful quotation."
        crumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />

      <Section>
        <div className="grid gap-14 lg:grid-cols-[1.6fr_1fr] lg:gap-20">
          <div>
            <h2 className="mb-8 t-h2 text-navy-950">
              Project enquiry
            </h2>
            <EnquiryForm serviceOptions={serviceOptions} defaultService={defaultService} />
          </div>

          <aside className="self-start">
            <h2 className="border-b border-steel-200 pb-3 t-label text-steel-500">
              Direct contact
            </h2>
            <ul>
              {channels.map((c) => (
                <li key={c.label} className="border-t border-steel-200">
                  <a
                    href={c.href}
                    {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group flex gap-4 py-5 hover:bg-steel-100 sm:px-3"
                  >
                    <c.icon aria-hidden className="mt-1 size-5 shrink-0 text-accent-strong" />
                    <span>
                      <span className="block t-label text-steel-500">
                        {c.label}
                      </span>
                      <span className="mt-1 block break-all text-navy-950">{c.value}</span>
                    </span>
                  </a>
                </li>
              ))}
              <li className="border-t border-steel-200">
                <div className="flex gap-4 py-5 sm:px-3">
                  <MapPin aria-hidden className="mt-1 size-5 shrink-0 text-accent-strong" />
                  <span>
                    <span className="block t-label text-steel-500">
                      Coverage
                    </span>
                    <span className="mt-1 block text-navy-950">
                      Projects across {SITE.country}
                    </span>
                  </span>
                </div>
              </li>
            </ul>

            <div className="mt-8 rounded-lg border border-steel-200 bg-steel-50 p-6">
              <h3 className="t-h4 text-navy-950">What helps us quote</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-steel-600">
                <li>Site location and type of building or facility</li>
                <li>Electrical drawings or load details, if available</li>
                <li>Required completion date</li>
                <li>Photos of the existing installation, for upgrades</li>
              </ul>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
