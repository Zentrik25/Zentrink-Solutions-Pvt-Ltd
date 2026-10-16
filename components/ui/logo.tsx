import { cn } from "@/lib/cn";

/**
 * Wordmark placeholder: a flat square monogram with the company name.
 * Replace with the official logo file when it is supplied.
 */
export function Logo({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  const light = tone === "light";
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <svg
        aria-hidden
        viewBox="0 0 40 40"
        className="size-10 shrink-0"
      >
        <rect width="40" height="40" fill={light ? "#ffffff" : "#0b1f3a"} />
        <path
          d="M10 11h20v5L16.5 24H30v5H10v-5l13.5-8H10z"
          fill={light ? "#0b1f3a" : "#ffffff"}
        />
        <rect x="30" y="29" width="4" height="4" fill="#f26a1b" />
      </svg>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-lg font-extrabold uppercase tracking-wide",
            light ? "text-white" : "text-navy-900",
          )}
        >
          Zentrik
        </span>
        <span
          className={cn(
            "mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em]",
            light ? "text-steel-300" : "text-steel-600",
          )}
        >
          Solutions (Pvt) Ltd
        </span>
      </span>
    </span>
  );
}
