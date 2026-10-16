import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "outline-light";

const base =
  "inline-flex items-center justify-center gap-2 border-2 px-6 py-3.5 text-sm font-bold uppercase tracking-wider transition-colors duration-150 focus-visible:outline-offset-4";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-accent bg-accent text-navy-950 hover:border-accent-strong hover:bg-accent-strong hover:text-white",
  secondary:
    "border-navy-900 bg-navy-900 text-white hover:border-navy-700 hover:bg-navy-700",
  outline:
    "border-navy-900 bg-transparent text-navy-900 hover:bg-navy-900 hover:text-white",
  "outline-light":
    "border-white bg-transparent text-white hover:bg-white hover:text-navy-900",
};

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={cn(base, variants[variant], className)} {...props}>
      {children}
    </Link>
  );
}

type ExternalButtonProps = Omit<ComponentProps<"a">, "className"> & {
  variant?: ButtonVariant;
  className?: string;
};

/** Anchor styled as a button for tel:, mailto: and external (WhatsApp) links. */
export function ExternalButton({
  variant = "primary",
  className,
  children,
  ...props
}: ExternalButtonProps) {
  return (
    <a className={cn(base, variants[variant], className)} {...props}>
      {children}
    </a>
  );
}

export function SubmitButton({
  children,
  pending,
}: {
  children: ReactNode;
  pending?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        base,
        variants.primary,
        "disabled:cursor-not-allowed disabled:opacity-60",
      )}
    >
      {children}
    </button>
  );
}
