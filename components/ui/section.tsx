import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "./container";

export type Tone = "light" | "muted" | "navy" | "charcoal";

const tones: Record<Tone, string> = {
  light: "bg-white text-charcoal-800",
  muted: "bg-steel-100 text-charcoal-800",
  navy: "bg-navy-900 text-white",
  charcoal: "bg-charcoal-900 text-white",
};

type SectionProps = ComponentProps<"section"> & {
  tone?: Tone;
  containerClassName?: string;
};

export function Section({
  tone = "light",
  className,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn("py-16 lg:py-24", tones[tone], className)} {...props}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

export function Eyebrow({
  children,
  tone = "light",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  const dark = tone === "navy" || tone === "charcoal";
  return (
    <p
      className={cn(
        "mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em]",
        dark ? "text-accent" : "text-accent-strong",
      )}
    >
      <span aria-hidden className="h-0.5 w-8 bg-current" />
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
  const dark = tone === "navy" || tone === "charcoal";
  return (
    <div className={cn("max-w-3xl", className)}>
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <Tag
        className={cn(
          "text-3xl font-extrabold uppercase leading-[1.05] sm:text-4xl lg:text-5xl",
          dark ? "text-white" : "text-navy-900",
        )}
      >
        {title}
      </Tag>
      {intro && (
        <p
          className={cn(
            "mt-5 text-lg leading-relaxed",
            dark ? "text-steel-300" : "text-steel-600",
          )}
        >
          {intro}
        </p>
      )}
    </div>
  );
}
