import type { ReactNode } from "react";
import { Container } from "./container";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";
import { Eyebrow } from "./section";

export function PageHero({
  eyebrow,
  title,
  intro,
  crumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  crumbs?: Crumb[];
  children?: ReactNode;
}) {
  return (
    <header className="border-b-4 border-accent bg-navy-900 py-14 text-white lg:py-20">
      <Container>
        {crumbs && <Breadcrumbs items={crumbs} />}
        {eyebrow && <Eyebrow tone="navy">{eyebrow}</Eyebrow>}
        <h1 className="max-w-4xl text-4xl font-extrabold uppercase leading-[1.02] sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {intro && (
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-steel-300">
            {intro}
          </p>
        )}
        {children && <div className="mt-8 flex flex-wrap gap-4">{children}</div>}
      </Container>
    </header>
  );
}
