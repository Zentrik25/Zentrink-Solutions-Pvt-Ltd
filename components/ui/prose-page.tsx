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
        <div className="mx-auto max-w-3xl space-y-6 text-[1.0625rem] leading-relaxed text-steel-600 [&_h2]:!mt-12 [&_h2]:t-h3 [&_a]:text-accent-strong [&_a]:underline [&_a]:underline-offset-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          <p className="t-label text-steel-500">
            Last updated: {updated}
          </p>
          {children}
        </div>
      </Section>
    </>
  );
}
