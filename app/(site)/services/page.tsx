import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { getServices } from "@/lib/data";
import { PageHero } from "@/components/ui/page-hero";
import { Section, SectionHeading } from "@/components/ui/section";
import { ServiceIcon } from "@/components/ui/service-icon";
import { CtaBand } from "@/components/ui/cta-band";
import { DELIVERY_PROCESS, ProcessSteps } from "@/components/sections/process-steps";

export const metadata: Metadata = pageMetadata({
  title: "Electrical Engineering Services",
  description:
    "Electrical installations, power distribution, solar energy, industrial maintenance, testing and commissioning, and equipment procurement across Zimbabwe.",
  path: "/services",
});

export default async function ServicesPage() {
  const SERVICES = await getServices();
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Electrical engineering services"
        intro="Six service lines covering the full electrical scope of commercial, industrial, institutional and residential projects."
        crumbs={[{ label: "Home", href: "/" }, { label: "Services" }]}
      />

      <Section>
        <ul className="space-y-6">
          {SERVICES.map((s, i) => (
            <li key={s.slug}>
              <Link
                href={`/services/${s.slug}`}
                className="group grid overflow-hidden rounded-lg border border-steel-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated md:grid-cols-[17rem_1fr] lg:grid-cols-[20rem_1fr_auto]"
              >
                <Image
                  src={s.image.src}
                  alt={s.image.alt}
                  width={s.image.width}
                  height={s.image.height}
                  sizes="(min-width: 1024px) 320px, (min-width: 768px) 272px, 100vw"
                  className="aspect-[16/10] h-full w-full object-cover md:aspect-auto"
                />
                <div className="p-6 lg:p-8">
                  <div className="flex items-center gap-3">
                    <span className="t-label tnum text-steel-500">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex size-8 items-center justify-center rounded-md bg-accent/10 text-accent-strong">
                      <ServiceIcon name={s.icon} className="size-4" />
                    </span>
                  </div>
                  <h2 className="t-h3 mt-3 text-navy-950">{s.title}</h2>
                  <p className="mt-3 max-w-xl leading-relaxed text-steel-500">{s.summary}</p>
                  <ul className="mt-5 space-y-1.5 text-[0.9rem] text-steel-600">
                    {s.scope.slice(0, 3).map((item) => (
                      <li key={item} className="flex gap-3">
                        <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-xs bg-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="flex items-end p-6 text-sm text-accent-strong lg:items-center lg:p-8">
                  <span className="flex items-center gap-1.5">
                    Details <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="navy">
        <SectionHeading tone="navy" eyebrow="How we work" title="One delivery process across every service." />
        <div className="mt-14">
          <ProcessSteps steps={DELIVERY_PROCESS} tone="dark" />
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
