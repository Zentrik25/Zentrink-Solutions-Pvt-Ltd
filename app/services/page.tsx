import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SERVICES } from "@/lib/services";
import { PageHero } from "@/components/ui/page-hero";
import { Section, SectionHeading } from "@/components/ui/section";
import { ServiceIcon } from "@/components/ui/service-icon";
import { CtaBand } from "@/components/ui/cta-band";
import { DELIVERY_PROCESS, ProcessSteps } from "@/components/sections/process-steps";

export const metadata: Metadata = {
  title: "Electrical Engineering Services",
  description:
    "Electrical installations, power distribution, solar energy, industrial maintenance, testing and commissioning, and equipment procurement across Zimbabwe.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Electrical engineering services"
        intro="Six service lines covering the full electrical scope of commercial, industrial, institutional and residential projects."
        crumbs={[{ label: "Home", href: "/" }, { label: "Services" }]}
      />

      <Section>
        <ul className="border-t border-navy-900">
          {SERVICES.map((s, i) => (
            <li key={s.slug} className="border-b border-steel-300">
              <Link
                href={`/services/${s.slug}`}
                className="group grid gap-6 py-10 transition-colors hover:bg-steel-100 md:grid-cols-[4rem_1.1fr_1.6fr_auto] md:items-start md:px-4"
              >
                <span className="font-display text-2xl font-black text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="flex items-start gap-4 text-2xl font-extrabold uppercase text-navy-900">
                  <ServiceIcon name={s.icon} className="mt-0.5 size-7 shrink-0" />
                  {s.title}
                </h2>
                <div>
                  <p className="leading-relaxed text-steel-600">{s.summary}</p>
                  <ul className="mt-4 space-y-1.5 text-sm text-charcoal-700">
                    {s.scope.slice(0, 3).map((item) => (
                      <li key={item} className="flex gap-3">
                        <span aria-hidden className="mt-2 size-1.5 shrink-0 bg-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-accent-strong">
                  Details
                  <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="navy">
        <SectionHeading
          tone="navy"
          eyebrow="How we work"
          title="One delivery process across every service."
        />
        <div className="mt-14">
          <ProcessSteps steps={DELIVERY_PROCESS} tone="dark" />
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
