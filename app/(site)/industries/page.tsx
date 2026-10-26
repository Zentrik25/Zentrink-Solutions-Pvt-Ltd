import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { getIndustries } from "@/lib/data";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { CtaBand } from "@/components/ui/cta-band";

export const metadata: Metadata = pageMetadata({
  title: "Industries We Serve",
  description:
    "Electrical engineering for mining, manufacturing, agriculture, construction, commercial buildings, residential developments and public infrastructure in Zimbabwe.",
  path: "/industries",
});

export default async function IndustriesPage() {
  const industries = await getIndustries();
  return (
    <>
      <PageHero
        eyebrow="Industries"
        title="Industries we serve"
        intro="Each sector has its own load types, environments and compliance needs. Choose an industry to see how our services apply."
        crumbs={[{ label: "Home", href: "/" }, { label: "Industries" }]}
      />

      <Section>
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {industries.map((ind, i) => (
            <li key={ind.slug}>
              <Link
                href={`/industries/${ind.slug}`}
                className="group flex h-full flex-col rounded-lg border border-steel-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <span className="t-label tnum text-steel-500">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="t-h3 mt-3 text-navy-950">{ind.title}</h2>
                <p className="mt-3 flex-1 leading-relaxed text-steel-500">{ind.summary}</p>
                <span className="mt-6 flex items-center gap-1.5 text-sm text-accent-strong">
                  Explore {ind.title.toLowerCase()}
                  <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand title="Tell us about your site" />
    </>
  );
}
