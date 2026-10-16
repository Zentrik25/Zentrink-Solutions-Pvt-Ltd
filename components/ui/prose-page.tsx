import type { ReactNode } from "react";
import { PageHero } from "./page-hero";
import { Section } from "./section";

export function ProsePage({
  title,
  intro,
  updated,
  crumbLabel,
  children,
}: {
  title: string;
  intro: string;
  updated: string;
  crumbLabel: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title={title}
        intro={intro}
        crumbs={[{ label: "Home", href: "/" }, { label: crumbLabel }]}
      />
      <Section>
        <div className="mx-auto max-w-3xl space-y-6 text-lg leading-relaxed text-charcoal-800 [&_h2]:!mt-12 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:uppercase [&_h2]:text-navy-900 [&_a]:font-semibold [&_a]:underline [&_a]:decoration-accent [&_a]:decoration-2 [&_a]:underline-offset-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          <p className="text-sm font-bold uppercase tracking-wider text-steel-500">
            Last updated: {updated}
          </p>
          {children}
        </div>
      </Section>
    </>
  );
}
