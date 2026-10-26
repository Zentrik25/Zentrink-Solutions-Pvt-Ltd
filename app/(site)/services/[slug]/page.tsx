import type { Metadata } from "next";
import { absoluteUrl, jsonLd as safeJsonLd, pageMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { getIndustriesForService, getService, getServices } from "@/lib/data";
import { PageHero } from "@/components/ui/page-hero";
import { Card, Section, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { FaqList } from "@/components/ui/faq";
import { CtaBand } from "@/components/ui/cta-band";
import { ProcessSteps } from "@/components/sections/process-steps";
import { ServiceIcon } from "@/components/ui/service-icon";
import { SITE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getServices()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return {};
  return pageMetadata({
    title: service.seo?.title ?? service.title,
    description: service.seo?.description ?? service.summary,
    path: `/services/${service.slug}`,
  });
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();

  const [relatedAll, industries] = await Promise.all([
    Promise.all(service.related.map((r) => getService(r))),
    getIndustriesForService(service.slug),
  ]);
  const related = relatedAll.filter((s): s is NonNullable<typeof s> => Boolean(s));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${absoluteUrl(`/services/${service.slug}`)}#service`,
    name: service.title,
    serviceType: service.title,
    description: service.summary,
    url: absoluteUrl(`/services/${service.slug}`),
    provider: { "@type": "Organization", "@id": `${absoluteUrl("/")}#organization`, name: SITE.name, url: SITE.url },
    areaServed: { "@type": "Country", name: SITE.country },
    image: service.image.src.startsWith("http") ? service.image.src : absoluteUrl(service.image.src),
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
        aside={
          <div className="overflow-hidden rounded-lg border border-white shadow-elevated">
            <Image
              src={service.image.src}
              alt={service.image.alt}
              width={service.image.width}
              height={service.image.height}
              fetchPriority="high"
              loading="eager"
              sizes="(min-width: 1024px) 460px, 100vw"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        }
      >
        <ButtonLink href={`/request-a-quote?service=${service.slug}`}>Request a Project Quote</ButtonLink>
        <ButtonLink href="/contact" variant="outline">
          Talk to an engineer
        </ButtonLink>
      </PageHero>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
          <div>
            <SectionHeading eyebrow="Technical overview" title="Overview" />
            <div className="mt-6 space-y-5 text-[1.0625rem] leading-relaxed text-steel-500">
              {service.overview.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
          <Card elevated className="self-start p-6">
            <span className="flex size-10 items-center justify-center rounded-md bg-accent/10 text-accent-strong">
              <ServiceIcon name={service.icon} className="size-5" />
            </span>
            <h2 className="t-label mt-5 text-steel-500">Typical applications</h2>
            <ul className="mt-4 space-y-3">
              {service.applications.map((a) => (
                <li key={a} className="flex gap-3 text-navy-950">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-xs bg-accent" />
                  {a}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading eyebrow="Scope of services" title="What is included" />
        <ul className="mt-12 grid gap-3 md:grid-cols-2">
          {service.scope.map((item) => (
            <li key={item} className="flex gap-3 rounded-md border border-steel-200 bg-white p-4">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-xs bg-accent/10 text-accent-strong">
                <Check aria-hidden className="size-3.5" />
              </span>
              <span className="leading-relaxed text-steel-600">{item}</span>
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

      {industries.length > 0 && (
        <Section>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
            <SectionHeading
              eyebrow="Relevant industries"
              title="Where this service is applied"
              intro="The same engineering approach adapts to the conditions of each sector."
            />
            <ul className="grid gap-3 sm:grid-cols-2">
              {industries.map((ind) => (
                <li key={ind.slug}>
                  <Link
                    href={`/industries/${ind.slug}`}
                    className="group flex items-center justify-between gap-4 rounded-md border border-steel-200 bg-white px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-card"
                  >
                    <span className="text-navy-950">{ind.title}</span>
                    <ArrowRight aria-hidden className="size-4 text-accent-strong transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}

      <Section tone="muted">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <SectionHeading
            eyebrow="FAQs"
            title="Common questions"
            intro="Answers to what clients ask most often about this service."
          />
          <FaqList items={service.faqs} />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Related services" title="Often specified together" />
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {related.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/services/${r.slug}`}
                className="group flex h-full flex-col rounded-lg border border-steel-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <span className="flex size-9 items-center justify-center rounded-md bg-accent/10 text-accent-strong">
                  <ServiceIcon name={r.icon} className="size-5" />
                </span>
                <h3 className="t-h3 mt-5 text-navy-950">{r.title}</h3>
                <p className="mt-2 flex-1 text-[0.9375rem] leading-relaxed text-steel-500">{r.summary}</p>
                <span className="mt-5 flex items-center gap-1.5 text-sm text-accent-strong">
                  View service <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand title={`Enquire about ${service.title.toLowerCase()}`} service={service.slug} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }}
      />
    </>
  );
}
