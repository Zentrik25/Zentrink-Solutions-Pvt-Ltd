import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "./container";

export type Tone = "light" | "muted" | "navy" | "charcoal";

const tones: Record<Tone, string> = {
  light: "bg-white",
  muted: "bg-steel-50",
  navy: "bg-navy-900 text-white",
  charcoal: "bg-navy-950 text-white",
};

type SectionProps = ComponentProps<"section"> & {
  tone?: Tone;
  containerClassName?: string;
};

export function Section({ tone = "light", className, containerClassName, children, ...props }: SectionProps) {
  return (
    <section className={cn("relative py-16 lg:py-24", tones[tone], className)} {...props}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

const isDark = (t: Tone) => t === "navy" || t === "charcoal";

/** Small monospace label with a short warm rule: the system's "code label" treatment. */
export function Eyebrow({ children, tone = "light" }: { children: ReactNode; tone?: Tone }) {
  return (
    <p className={cn("t-label mb-4 flex items-center gap-3", isDark(tone) ? "text-accent" : "text-accent-strong")}>
      <span aria-hidden className="bg-brand-gradient h-0.5 w-6 rounded-xs" />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  tone = "light",
  as: Tag = "h2",
  className,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  tone?: Tone;
  as?: "h1" | "h2";
  className?: string;
}) {
  const dark = isDark(tone);
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <Tag className={cn(Tag === "h1" ? "t-h1" : "t-h2", dark ? "!text-white" : "text-navy-950")}>{title}</Tag>
      {intro && <p className={cn("t-lead mt-4", dark ? "text-white/70" : "text-steel-500")}>{intro}</p>}
    </div>
  );
}

/** Bordered surface with the system's standard radius and optional elevation. */
export function Card({
  className,
  elevated,
  dark,
  ...props
}: ComponentProps<"div"> & { elevated?: boolean; dark?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border",
        dark ? "border-white/10 bg-white/[0.04] text-white" : "border-steel-200 bg-white",
        elevated && "shadow-elevated",
        className,
      )}
      {...props}
    />
  );
}

/** Neutral badge: 4px radius, hairline border. */
export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border border-steel-200 bg-white px-2.5 py-1 text-[0.8125rem] leading-none text-navy-950",
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-xs bg-accent" />
      {children}
    </span>
  );
}
