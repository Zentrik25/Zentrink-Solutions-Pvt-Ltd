import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { MessageCircle, Phone, Mail } from "lucide-react";
import { whatsappLink, WHATSAPP_DEFAULT_MESSAGE } from "@/lib/site";
import { getContact, getServices } from "@/lib/data";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { EnquiryForm } from "@/components/forms/enquiry-form";

export const metadata: Metadata = pageMetadata({
  title: "Request a Project Quote",
  description:
    "Request a quotation for electrical installations, power distribution, solar energy, maintenance, testing or equipment procurement in Zimbabwe.",
  path: "/request-a-quote",
});

type Props = { searchParams: Promise<{ service?: string }> };

const STEPS = [
  { title: "Send your brief", text: "Describe the site, the work and your timeline." },
  { title: "We review it", text: "We check scope and tell you what else we need, including whether a site visit is required." },
  { title: "Quotation", text: "You receive a defined scope and price to review and compare." },
];

export default async function RequestQuotePage({ searchParams }: Props) {
  const { service } = await searchParams;
  const [services, contact] = await Promise.all([getServices(), getContact()]);
  const serviceOptions = [...services.map((s) => ({ value: s.slug, label: s.title })), { value: "multiple", label: "Multiple services / not sure yet" }];
  const defaultService = services.some((s) => s.slug === service) ? service : "";

  return (
    <>
      <PageHero
        eyebrow="Request a quote"
        title="Request a project quote"
        intro="Give us the details of your project. A complete brief lets us price accurately and avoid delays."
        crumbs={[{ label: "Home", href: "/" }, { label: "Request a Quote" }]}
      />

      <Section>
        <div className="grid gap-14 lg:grid-cols-[1.6fr_1fr] lg:gap-20">
          <EnquiryForm serviceOptions={serviceOptions} defaultService={defaultService} />

          <aside className="space-y-10 self-start">
            <div>
              <h2 className="border-t-4 border-navy-900 py-4 text-xs font-bold uppercase tracking-[0.2em] text-steel-500">
                What happens next
              </h2>
              <ol className="space-y-5">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="grid grid-cols-[2.5rem_1fr] border-t border-steel-300 pt-5">
                    <span className="font-display text-lg font-black text-accent-strong">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-extrabold uppercase text-navy-900">{s.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-steel-600">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="border-l-4 border-accent bg-steel-100 p-6">
              <h2 className="font-extrabold uppercase text-navy-900">Prefer to talk?</h2>
              <ul className="mt-4 space-y-3 text-sm font-semibold text-navy-900">
                <li>
                  <a href={contact.phoneHref} className="flex items-center gap-3 hover:text-accent-strong">
                    <Phone aria-hidden className="size-4" />
                    {contact.phone}
                  </a>
                </li>
                <li>
                  <a
                    href={whatsappLink(WHATSAPP_DEFAULT_MESSAGE, contact.whatsappNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:text-accent-strong"
                  >
                    <MessageCircle aria-hidden className="size-4" />
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a href={contact.mailto} className="flex items-center gap-3 break-all hover:text-accent-strong">
                    <Mail aria-hidden className="size-4" />
                    {contact.email}
                  </a>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
