import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { INDUSTRIES } from "@/lib/industries";
import { getService } from "@/lib/services";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { CtaBand } from "@/components/ui/cta-band";

export const metadata: Metadata = {
  title: "Industries We Serve",
  description:
    "Electrical engineering for mining, manufacturing, agriculture, construction, commercial buildings, residential developments and public infrastructure in Zimbabwe.",
  alternates: { canonical: "/industries" },
};

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        eyebrow="Industries"
        title="Industries we serve"
        intro="Each sector has its own load types, environments and compliance needs. Here is how our services apply to each."
        crumbs={[{ label: "Home", href: "/" }, { label: "Industries" }]}
      />

      <nav aria-label="Industry sections" className="border-b border-steel-200 bg-white">
        <ul className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-5 text-xs font-bold uppercase tracking-wider sm:px-8 lg:px-10">
          {INDUSTRIES.map((i) => (
            <li key={i.slug}>
              <a
                href={`#${i.slug}`}
                className="block whitespace-nowrap py-4 text-charcoal-700 hover:text-accent-strong"
              >
                {i.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {INDUSTRIES.map((ind, idx) => (
        <Section key={ind.slug} id={ind.slug} tone={idx % 2 === 0 ? "light" : "muted"}>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <div>
              <p className="font-display text-5xl font-black text-accent">
                {String(idx + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-4 text-3xl font-extrabold uppercase text-navy-900 sm:text-4xl">
                {ind.title}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-steel-600">{ind.summary}</p>
            </div>
            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <h3 className="border-b-2 border-navy-900 pb-3 text-xs font-bold uppercase tracking-[0.2em] text-navy-900">
                  Typical electrical needs
                </h3>
                <ul className="mt-5 space-y-4">
                  {ind.needs.map((n) => (
                    <li key={n} className="flex gap-3 leading-relaxed">
                      <Check aria-hidden className="mt-1 size-4 shrink-0 text-accent-strong" />
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="border-b-2 border-navy-900 pb-3 text-xs font-bold uppercase tracking-[0.2em] text-navy-900">
                  Relevant services
                </h3>
                <ul className="mt-5 space-y-4">
                  {ind.services.map((slug) => {
                    const s = getService(slug);
                    if (!s) return null;
                    return (
                      <li key={slug}>
                        <Link
                          href={`/services/${slug}`}
                          className="font-bold text-navy-900 underline decoration-accent decoration-2 underline-offset-4 hover:text-accent-strong"
                        >
                          {s.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </Section>
      ))}

      <CtaBand title="Tell us about your site" />
    </>
  );
}
