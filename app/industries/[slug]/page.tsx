import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { getIndustries, getIndustry, getService } from "@/lib/data";
import { PageHero } from "@/components/ui/page-hero";
import { Section, SectionHeading } from "@/components/ui/section";
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
  const title = `Electrical Engineering for ${industry.title}`;
  return {
    title,
    description: industry.summary.slice(0, 158),
    alternates: { canonical: `/industries/${industry.slug}` },
    openGraph: { title, description: industry.summary.slice(0, 158), url: `/industries/${industry.slug}` },
  };
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
      </PageHero>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading eyebrow="Challenges" title="What this sector demands" />
            <ul className="mt-10 space-y-5">
              {industry.challenges.map((c) => (
                <li key={c} className="flex gap-4 text-lg leading-relaxed text-steel-600">
                  <span aria-hidden className="mt-3 size-1.5 shrink-0 bg-accent" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t-4 border-navy-900 bg-steel-100 p-8">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-steel-500">
              Typical electrical needs
            </h2>
            <ul className="mt-5 space-y-4">
              {industry.needs.map((n) => (
                <li key={n} className="flex gap-3 leading-relaxed">
                  <Check aria-hidden className="mt-1 size-4 shrink-0 text-accent-strong" />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section tone="navy">
        <SectionHeading tone="navy" eyebrow="Our approach" title="How we engineer for it" />
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {industry.approach.map((a, i) => (
            <li key={a} className="border-t-4 border-accent pt-6">
              <span className="font-display text-3xl font-black text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-4 text-lg leading-relaxed text-steel-300">{a}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="muted">
        <SectionHeading eyebrow="Relevant services" title="Services for this sector" />
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {services.map((s) => (
            <li key={s.slug} className="border border-steel-300 bg-white">
              <Link href={`/services/${s.slug}`} className="group flex h-full flex-col p-6 hover:bg-navy-900">
                <ServiceIcon name={s.icon} className="size-8 text-navy-900 group-hover:text-accent" />
                <h3 className="mt-6 text-lg font-extrabold uppercase text-navy-900 group-hover:text-white">
                  {s.title}
                </h3>
                <p className="mt-2 flex-1 text-steel-600 group-hover:text-steel-300">{s.summary}</p>
                <span className="mt-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-accent-strong group-hover:text-accent">
                  View service <ArrowRight aria-hidden className="size-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <SectionHeading eyebrow="FAQs" title={`${industry.title}: common questions`} />
          <FaqList items={industry.faqs} />
        </div>
      </Section>

      <Section tone="muted">
        <h2 className="text-2xl font-extrabold uppercase text-navy-900">Other industries</h2>
        <ul className="mt-8 flex flex-wrap gap-3">
          {others.map((o) => (
            <li key={o.slug}>
              <Link
                href={`/industries/${o.slug}`}
                className="block border-2 border-steel-300 bg-white px-4 py-2 text-sm font-bold uppercase tracking-wider text-charcoal-700 hover:border-navy-900"
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
