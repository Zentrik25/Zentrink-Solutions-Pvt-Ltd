import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { getIndustries, getIndustry, getService } from "@/lib/data";
import { PageHero } from "@/components/ui/page-hero";
import { Card, Section, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { FaqList } from "@/components/ui/faq";
import { CtaBand } from "@/components/ui/cta-band";
import { ServiceIcon } from "@/components/ui/service-icon";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getIndustries()).map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const industry = await getIndustry(slug);
  if (!industry) return {};
  return pageMetadata({
    title: industry.seo?.title ?? `Electrical Engineering for ${industry.title}`,
    description: industry.seo?.description ?? industry.summary.slice(0, 158),
    path: `/industries/${industry.slug}`,
  });
}

export default async function IndustryPage({ params }: Props) {
  const { slug } = await params;
  const industry = await getIndustry(slug);
  if (!industry) notFound();

  const services = (await Promise.all(industry.services.map((s) => getService(s)))).filter(
    (s): s is NonNullable<typeof s> => Boolean(s),
  );
  const all = await getIndustries();
  const others = all.filter((i) => i.slug !== industry.slug);

  return (
    <>
      <PageHero
        eyebrow="Industry"
        title={industry.title}
        intro={industry.summary}
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Industries", href: "/industries" },
          { label: industry.title },
        ]}
      >
        <ButtonLink href="/request-a-quote">Request a Project Quote</ButtonLink>
        <ButtonLink href="/services" variant="outline">
          Our services
        </ButtonLink>
      </PageHero>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading eyebrow="Challenges" title="What this sector demands" />
            <ul className="mt-8 space-y-4">
              {industry.challenges.map((c) => (
                <li key={c} className="flex gap-4 text-[1.0625rem] leading-relaxed text-steel-500">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-xs bg-accent" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <Card elevated className="self-start p-6 lg:p-8">
            <h2 className="t-label text-steel-500">Typical electrical needs</h2>
            <ul className="mt-5 space-y-4">
              {industry.needs.map((n) => (
                <li key={n} className="flex gap-3 leading-relaxed text-navy-950">
                  <Check aria-hidden className="mt-1 size-4 shrink-0 text-accent-strong" />
                  {n}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      <Section tone="navy">
        <SectionHeading tone="navy" eyebrow="Our approach" title="How we engineer for it" />
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {industry.approach.map((a, i) => (
            <li key={a}>
              <Card dark className="h-full p-6">
                <span className="t-label tnum text-accent">{String(i + 1).padStart(2, "0")}</span>
                <p className="mt-3 text-[1.0625rem] leading-relaxed text-white/80">{a}</p>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="muted">
        <SectionHeading eyebrow="Relevant services" title="Services for this sector" />
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {services.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/services/${s.slug}`}
                className="group flex h-full flex-col rounded-lg border border-steel-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <span className="flex size-9 items-center justify-center rounded-md bg-accent/10 text-accent-strong">
                  <ServiceIcon name={s.icon} className="size-5" />
                </span>
                <h3 className="t-h3 mt-5 text-navy-950">{s.title}</h3>
                <p className="mt-2 flex-1 text-[0.9375rem] leading-relaxed text-steel-500">{s.summary}</p>
                <span className="mt-5 flex items-center gap-1.5 text-sm text-accent-strong">
                  View service <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <SectionHeading eyebrow="FAQs" title={`${industry.title}: common questions`} />
          <FaqList items={industry.faqs} />
        </div>
      </Section>

      <Section tone="muted" className="py-12 lg:py-14">
        <h2 className="t-h4 text-navy-950">Other industries</h2>
        <ul className="mt-5 flex flex-wrap gap-2">
          {others.map((o) => (
            <li key={o.slug}>
              <Link
                href={`/industries/${o.slug}`}
                className="block rounded-sm border border-steel-300 bg-white px-3.5 py-2 text-sm text-navy-950 transition-colors hover:border-accent hover:text-accent-strong"
              >
                {o.title}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand title={`Planning ${industry.title.toLowerCase()} electrical work?`} />
    </>
  );
}
