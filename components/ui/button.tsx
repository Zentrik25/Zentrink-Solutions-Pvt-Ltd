import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "outline-light";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border px-5 py-2.5 text-[0.9375rem] font-normal leading-none transition-colors duration-150";

const variants: Record<ButtonVariant, string> = {
  primary: "border-accent bg-accent text-navy-950 hover:border-[#e8590c] hover:bg-[#e8590c]",
  secondary: "border-navy-950 bg-navy-950 text-white hover:border-navy-800 hover:bg-navy-800",
  outline: "border-[#f2b999] bg-transparent text-accent-strong hover:bg-accent/[0.07]",
  "outline-light": "border-white/30 bg-transparent text-white hover:bg-white/10",
};

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({ variant = "primary", className, children, ...props }: ButtonLinkProps) {
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
export function ExternalButton({ variant = "primary", className, children, ...props }: ExternalButtonProps) {
  return (
    <a className={cn(base, variants[variant], className)} {...props}>
      {children}
    </a>
  );
}

export function SubmitButton({ children, pending }: { children: ReactNode; pending?: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(base, variants.primary, "disabled:cursor-not-allowed disabled:opacity-60")}
    >
      {children}
    </button>
  );
}
