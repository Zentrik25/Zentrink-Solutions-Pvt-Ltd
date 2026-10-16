import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { SERVICES, getService } from "@/lib/services";
import { PageHero } from "@/components/ui/page-hero";
import { Section, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { FaqList } from "@/components/ui/faq";
import { CtaBand } from "@/components/ui/cta-band";
import { ProcessSteps } from "@/components/sections/process-steps";
import { ServiceIcon } from "@/components/ui/service-icon";
import { SITE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.summary,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: `${service.title} | ${SITE.shortName}`,
      description: service.summary,
      url: `/services/${service.slug}`,
    },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const related = service.related
    .map((r) => getService(r))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.summary,
    provider: { "@type": "Organization", name: SITE.name, url: SITE.url },
    areaServed: { "@type": "Country", name: SITE.country },
  };

  return (
    <>
      <PageHero
        eyebrow="Service"
        title={service.title}
        intro={service.summary}
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Services", href: "/services" },
          { label: service.title },
        ]}
      >
        <ButtonLink href={`/contact?service=${service.slug}`}>Request a Project Quote</ButtonLink>
      </PageHero>

      <Image
        src={service.image.src}
        alt={service.image.alt}
        width={service.image.width}
        height={service.image.height}
        priority
        sizes="100vw"
        className="aspect-[16/9] max-h-[32rem] w-full object-cover"
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
          <div>
            <SectionHeading eyebrow="Technical overview" title="Overview" />
            <div className="mt-8 space-y-5 text-lg leading-relaxed text-steel-600">
              {service.overview.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
          <aside className="self-start border-t-4 border-accent bg-steel-100 p-8">
            <ServiceIcon name={service.icon} className="size-10 text-navy-900" />
            <h2 className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-steel-500">
              Typical applications
            </h2>
            <ul className="mt-4 space-y-3">
              {service.applications.map((a) => (
                <li key={a} className="flex gap-3 font-semibold text-navy-900">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 bg-accent" />
                  {a}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading eyebrow="Scope of services" title="What is included" />
        <ul className="mt-12 grid gap-x-12 border-t border-navy-900 md:grid-cols-2">
          {service.scope.map((item) => (
            <li key={item} className="flex gap-4 border-b border-steel-300 py-5">
              <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-accent-strong" />
              <span className="leading-relaxed text-charcoal-800">{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="navy">
        <SectionHeading tone="navy" eyebrow="Process" title="How we deliver" />
        <div className="mt-14">
          <ProcessSteps steps={service.process} tone="dark" />
        </div>
      </Section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <SectionHeading
            eyebrow="FAQs"
            title="Common questions"
            intro="Answers to what clients ask most often about this service."
          />
          <FaqList items={service.faqs} />
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading eyebrow="Related services" title="Often specified together" />
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {related.map((r) => (
            <li key={r.slug} className="border border-steel-300 bg-white">
              <Link href={`/services/${r.slug}`} className="group flex h-full flex-col p-6 hover:bg-navy-900">
                <ServiceIcon name={r.icon} className="size-8 text-navy-900 group-hover:text-accent" />
                <h3 className="mt-6 text-lg font-extrabold uppercase text-navy-900 group-hover:text-white">
                  {r.title}
                </h3>
                <p className="mt-2 flex-1 text-steel-600 group-hover:text-steel-300">{r.summary}</p>
                <span className="mt-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-accent-strong group-hover:text-accent">
                  View service <ArrowRight aria-hidden className="size-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand
        title={`Enquire about ${service.title.toLowerCase()}`}
        service={service.slug}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
