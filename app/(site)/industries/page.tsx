import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
        <ul className="border-t border-navy-900">
          {industries.map((ind, i) => (
            <li key={ind.slug} className="border-b border-steel-300">
              <Link
                href={`/industries/${ind.slug}`}
                className="group grid gap-4 py-8 hover:bg-steel-100 md:grid-cols-[4rem_1fr_2fr_auto] md:items-start md:px-4"
              >
                <span className="font-display text-2xl font-black text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="text-2xl font-extrabold uppercase text-navy-900">{ind.title}</h2>
                <p className="leading-relaxed text-steel-600">{ind.summary}</p>
                <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-accent-strong">
                  View
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
