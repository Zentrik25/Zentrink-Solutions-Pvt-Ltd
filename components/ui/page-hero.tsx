import type { ReactNode } from "react";
import { Container } from "./container";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";
import { Pill } from "./section";

/** Decorative warm bands: pure CSS, no images, hidden from assistive technology. */
export function HeroArt() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bg-brand-gradient absolute -right-24 -top-56 h-[34rem] w-[36rem] -skew-y-[14deg] rounded-lg opacity-[0.16]" />
      <div className="absolute -right-10 top-24 h-24 w-[30rem] -skew-y-[14deg] rounded-lg bg-navy-900 opacity-[0.06]" />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  intro,
  crumbs,
  children,
  aside,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  crumbs?: Crumb[];
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="relative border-b border-steel-200 bg-steel-50 py-12 lg:py-20">
      <HeroArt />
      <Container className="relative">
        {crumbs && <Breadcrumbs items={crumbs} />}
        <div className={aside ? "grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]" : ""}>
          <div>
            {eyebrow && <Pill className="mb-6">{eyebrow}</Pill>}
            <h1 className="t-h1 max-w-3xl text-navy-950">{title}</h1>
            {intro && <p className="t-lead mt-5 max-w-2xl text-steel-500">{intro}</p>}
            {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
          </div>
          {aside && <div>{aside}</div>}
        </div>
      </Container>
    </header>
  );
}
