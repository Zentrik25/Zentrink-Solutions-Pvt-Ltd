import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Mail, MessageCircle, Phone } from "lucide-react";
import { SITE, whatsappLink, WHATSAPP_DEFAULT_MESSAGE } from "@/lib/site";
import { getContact, getHomepage, getIndustries, getSeo, getServices } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/hero";
import { ServiceGrid } from "@/components/sections/service-grid";
import { FeaturedProjects } from "@/components/sections/featured-projects";
import { DELIVERY_PROCESS, ProcessSteps } from "@/components/sections/process-steps";
import { Card, Section, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { EnquiryForm } from "@/components/forms/enquiry-form";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo();
  return pageMetadata({ title: seo.defaultTitle, description: seo.defaultDescription, path: "/", absoluteTitle: true });
}

const CAPABILITIES = [
  { title: "Design and specification", text: "Load assessment, cable and protection sizing, and documented specifications before work starts." },
  { title: "Low-voltage distribution", text: "Main and sub-distribution boards, containment, cabling, earthing and bonding." },
  { title: "Medium-voltage and transformers", text: "Transformer, switchgear and network installation with protection coordination." },
  { title: "Solar and storage", text: "Grid-tied, hybrid and off-grid solar PV systems with battery storage." },
  { title: "Testing and commissioning", text: "Inspection, testing and functional commissioning with recorded results." },
  { title: "Maintenance and fault finding", text: "Planned maintenance, condition surveys and corrective repair of industrial systems." },
  { title: "Equipment procurement", text: "Technical specification, sourcing and review of electrical plant and materials." },
  { title: "Documentation and handover", text: "Test records, schedules and as-installed information supplied on completion." },
];

export default async function HomePage() {
  const [INDUSTRIES, services, contact, home] = await Promise.all([
    getIndustries(),
    getServices(),
    getContact(),
    getHomepage(),
  ]);
  const serviceOptions = [
    ...services.map((s) => ({ value: s.slug, label: s.title })),
    { value: "multiple", label: "Multiple services / not sure yet" },
  ];

  return (
    <>
      <Hero headline={home.heroHeadline} text={home.heroText} contact={contact} />

      <Section id="services">
        <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Services"
            title="Six disciplines, one accountable engineering partner."
            intro="From a single distribution board to site-wide networks and solar plants, we cover the electrical scope of your project end to end."
          />
          <ButtonLink href="/services" variant="outline" className="self-start lg:self-end">
            All services
          </ButtonLink>
        </div>
        <ServiceGrid />
      </Section>

      <Section tone="muted">
        <div className="grid items-start gap-12 [&>*]:min-w-0 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div>
            <SectionHeading eyebrow="About Zentrik Solutions" title={home.introHeading} />
            <div className="mt-6 max-w-xl space-y-4 text-[1.0625rem] leading-relaxed text-steel-500">
              {home.introParagraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <ButtonLink href="/about" variant="secondary" className="mt-9">
              Read the company profile
            </ButtonLink>
          </div>

          <Card elevated className="p-2">
            <p className="t-label px-4 pb-2 pt-4 text-steel-500">Company profile</p>
            <dl className="text-sm">
              {[
                ["Company", SITE.name],
                ["Discipline", "Electrical engineering"],
                ["Operating in", SITE.country],
                ["Telephone", contact.phone],
                ["Email", contact.email],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-4 border-t border-steel-200 px-4 py-3.5">
                  <dt className="text-steel-500">{k}</dt>
                  <dd className="break-words text-navy-950">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </Section>

      <Section tone="navy">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.4fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              tone="navy"
              eyebrow="Engineering capabilities"
              title="What we bring to a project."
              intro="Engineering discipline from first assessment to recorded handover."
            />
            <ButtonLink href="/request-a-quote" className="mt-8">
              Discuss your project
            </ButtonLink>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {CAPABILITIES.map((c, i) => (
              <li key={c.title}>
                <Card dark className="h-full p-6">
                  <span className="t-label tnum text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="t-h4 mt-3 !text-white">{c.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-white/65">{c.text}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section>
        <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Industries served"
            title="Electrical systems for the sectors that power Zimbabwe."
            intro="Each sector has its own load types, environments and compliance needs. We engineer to those conditions."
          />
          <ButtonLink href="/industries" variant="outline" className="self-start lg:self-end">
            All industries
          </ButtonLink>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INDUSTRIES.map((ind, i) => (
            <li key={ind.slug}>
              <Link
                href={`/industries/${ind.slug}`}
                className="group flex h-full flex-col rounded-lg border border-steel-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <span className="t-label tnum text-steel-500">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="t-h4 mt-3 text-navy-950">{ind.title}</h3>
                <p className="mt-2 line-clamp-3 flex-1 text-[0.875rem] leading-relaxed text-steel-500">{ind.summary}</p>
                <span className="mt-4 flex items-center gap-1.5 text-sm text-accent-strong">
                  Explore <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
          {INDUSTRIES.length % 4 !== 0 && (
            <li>
              <Link
                href="/request-a-quote"
                className="group flex h-full flex-col justify-between rounded-lg bg-navy-900 p-5 text-white transition-all hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <h3 className="t-h4 !text-white">Tell us about your site</h3>
                <span className="mt-4 flex items-center gap-1.5 text-sm text-amber">
                  Request a quote <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          )}
        </ul>
      </Section>

      <Section tone="muted">
        <SectionHeading
          eyebrow="Engineering delivery process"
          title="From first enquiry to energised system."
          intro="A defined sequence keeps scope, safety and quality under control at every stage."
        />
        <div className="mt-14">
          <ProcessSteps steps={DELIVERY_PROCESS} />
        </div>
      </Section>

      <Section>
        <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading eyebrow="Featured projects" title="Verified work." />
          <ButtonLink href="/projects" variant="outline" className="self-start lg:self-end">
            Project portfolio
          </ButtonLink>
        </div>
        <FeaturedProjects />
      </Section>

      <Section tone="muted">
        <SectionHeading eyebrow="Why Zentrik Solutions" title={home.whyHeading} />
        <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {home.why.map((w) => (
            <li key={w.title}>
              <Card className="h-full p-6">
                <span className="flex size-8 items-center justify-center rounded-md bg-accent/10 text-accent-strong">
                  <Check aria-hidden className="size-4" />
                </span>
                <h3 className="t-h4 mt-4 text-navy-950">{w.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-steel-500">{w.text}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="enquiry" tone="navy" className="overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="bg-brand-gradient absolute -left-40 -top-48 h-[30rem] w-[34rem] -skew-y-[14deg] rounded-lg opacity-[0.16]" />
        </div>
        <div className="relative grid gap-12 lg:grid-cols-[0.9fr_1.3fr] lg:gap-16">
          <div>
            <SectionHeading
              tone="navy"
              eyebrow="Project enquiry"
              title="Tell us about your project."
              intro="Send the site, scope and timeline. We will respond with what we need to prepare a quotation."
            />
            <ul className="mt-10 space-y-4 border-t border-white/10 pt-8 text-[0.9375rem]">
              <li>
                <a href={contact.phoneHref} className="flex items-center gap-3 text-white/80 hover:text-white">
                  <Phone aria-hidden className="size-4 text-accent" />
                  <span className="tnum">{contact.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={whatsappLink(WHATSAPP_DEFAULT_MESSAGE, contact.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-white/80 hover:text-white"
                >
                  <MessageCircle aria-hidden className="size-4 text-accent" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={contact.mailto} className="flex items-center gap-3 break-all text-white/80 hover:text-white">
                  <Mail aria-hidden className="size-4 text-accent" />
                  {contact.email}
                </a>
              </li>
            </ul>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-deep sm:p-9">
            <EnquiryForm serviceOptions={serviceOptions} />
          </div>
        </div>
      </Section>
    </>
  );
}
