import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MessageCircle, Phone, Mail } from "lucide-react";
import { SITE, whatsappLink, WHATSAPP_DEFAULT_MESSAGE } from "@/lib/site";
import { getContact, getHomepage, getIndustries, getSeo, getServices } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/hero";
import { ServiceGrid } from "@/components/sections/service-grid";
import { FeaturedProjects } from "@/components/sections/featured-projects";
import { DELIVERY_PROCESS, ProcessSteps } from "@/components/sections/process-steps";
import { Section, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { EnquiryForm } from "@/components/forms/enquiry-form";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo();
  return pageMetadata({ title: seo.defaultTitle, description: seo.defaultDescription, path: "/", absoluteTitle: true });
}

const CAPABILITIES = [
  {
    title: "Design and specification",
    text: "Load assessment, cable and protection sizing, and documented specifications before work starts.",
  },
  {
    title: "Low-voltage distribution",
    text: "Main and sub-distribution boards, containment, cabling, earthing and bonding.",
  },
  {
    title: "Medium-voltage and transformers",
    text: "Transformer, switchgear and network installation with protection coordination.",
  },
  {
    title: "Solar and storage",
    text: "Grid-tied, hybrid and off-grid solar PV systems with battery storage.",
  },
  {
    title: "Testing and commissioning",
    text: "Inspection, testing and functional commissioning with recorded results.",
  },
  {
    title: "Maintenance and fault finding",
    text: "Planned maintenance, condition surveys and corrective repair of industrial systems.",
  },
  {
    title: "Equipment procurement",
    text: "Technical specification, sourcing and review of electrical plant and materials.",
  },
  {
    title: "Documentation and handover",
    text: "Test records, schedules and as-installed information supplied on completion.",
  },
];

export default async function HomePage() {
  const [INDUSTRIES, services, contact, home] = await Promise.all([getIndustries(), getServices(), getContact(), getHomepage()]);
  const serviceOptions = [...services.map((s) => ({ value: s.slug, label: s.title })), { value: "multiple", label: "Multiple services / not sure yet" }];
  return (
    <>
      <Hero headline={home.heroHeadline} text={home.heroText} contact={contact} />

      <Section id="services" tone="muted">
        <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Services"
            title="Six disciplines. One accountable engineering partner."
            intro="From a single distribution board to site-wide networks and solar plants, we cover the electrical scope of your project end to end."
          />
          <ButtonLink href="/services" variant="outline" className="self-start lg:self-end">
            All Services
          </ButtonLink>
        </div>
        <ServiceGrid />
      </Section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="About Zentrik Solutions"
              title={home.introHeading}
            />
            <div className="mt-8 space-y-5 text-lg leading-relaxed text-steel-600">
              {home.introParagraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <ButtonLink href="/about" variant="secondary" className="mt-10">
              Read the Company Profile
            </ButtonLink>
          </div>

          <dl className="self-start border-t-4 border-navy-900 text-sm">
            {[
              ["Company", SITE.name],
              ["Discipline", "Electrical engineering"],
              ["Operating in", SITE.country],
              ["Telephone", contact.phone],
              ["Email", contact.email],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[8rem_1fr] gap-4 border-b border-steel-300 py-4">
                <dt className="font-bold uppercase tracking-wider text-steel-500">{k}</dt>
                <dd className="break-words font-semibold text-navy-900">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section tone="charcoal">
        <SectionHeading
          tone="charcoal"
          eyebrow="Engineering capabilities"
          title="What we bring to a project."
        />
        <ul className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {CAPABILITIES.map((c, i) => (
            <li key={c.title} className="grid grid-cols-[3.5rem_1fr] border-t border-charcoal-700 pt-6">
              <span className="font-display text-xl font-black text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-lg font-extrabold uppercase">{c.title}</h3>
                <p className="mt-2 leading-relaxed text-steel-300">{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="Industries served"
              title="Electrical systems for the sectors that power Zimbabwe."
              intro="Each sector has its own load types, environments and compliance needs. We engineer to those conditions."
            />
            <ButtonLink href="/industries" variant="outline" className="mt-8">
              All Industries
            </ButtonLink>
          </div>
          <ul className="border-t border-navy-900">
            {INDUSTRIES.map((ind, i) => (
              <li key={ind.slug} className="border-b border-steel-300">
                <Link
                  href={`/industries/${ind.slug}`}
                  className="group flex items-center justify-between gap-4 py-5 transition-colors hover:bg-steel-100 sm:px-4"
                >
                  <span className="flex items-baseline gap-5">
                    <span className="font-display text-sm font-bold text-steel-500">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-xl font-extrabold uppercase text-navy-900">
                      {ind.title}
                    </span>
                  </span>
                  <ArrowUpRight
                    aria-hidden
                    className="size-5 text-steel-500 group-hover:text-accent-strong"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="navy">
        <SectionHeading
          tone="navy"
          eyebrow="Engineering delivery process"
          title="From first enquiry to energised system."
          intro="A defined sequence keeps scope, safety and quality under control at every stage."
        />
        <div className="mt-14">
          <ProcessSteps steps={DELIVERY_PROCESS} tone="dark" />
        </div>
      </Section>

      <Section tone="muted">
        <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading eyebrow="Featured projects" title="Verified work." />
          <ButtonLink href="/projects" variant="outline" className="self-start lg:self-end">
            Project Portfolio
          </ButtonLink>
        </div>
        <FeaturedProjects />
      </Section>

      <Section>
        <SectionHeading eyebrow="Why Zentrik Solutions" title={home.whyHeading} />
        <ul className="mt-14 grid border-l border-t border-steel-300 md:grid-cols-2 lg:grid-cols-3">
          {home.why.map((w) => (
            <li key={w.title} className="border-b border-r border-steel-300 p-8">
              <h3 className="text-lg font-extrabold uppercase text-navy-900">{w.title}</h3>
              <p className="mt-3 leading-relaxed text-steel-600">{w.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="enquiry" tone="charcoal">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div>
            <SectionHeading
              tone="charcoal"
              eyebrow="Project enquiry"
              title="Tell us about your project."
              intro="Send the site, scope and timeline. We will respond with what we need to prepare a quotation."
            />
            <ul className="mt-10 space-y-4 border-t border-charcoal-700 pt-8 font-semibold">
              <li>
                <a href={contact.phoneHref} className="flex items-center gap-3 hover:text-accent">
                  <Phone aria-hidden className="size-4 text-accent" />
                  {contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={whatsappLink(WHATSAPP_DEFAULT_MESSAGE, contact.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-accent"
                >
                  <MessageCircle aria-hidden className="size-4 text-accent" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={contact.mailto} className="flex items-center gap-3 break-all hover:text-accent">
                  <Mail aria-hidden className="size-4 text-accent" />
                  {contact.email}
                </a>
              </li>
            </ul>
          </div>
          <div className="bg-white p-6 text-charcoal-800 sm:p-10">
            <EnquiryForm serviceOptions={serviceOptions} />
          </div>
        </div>
      </Section>
    </>
  );
}
