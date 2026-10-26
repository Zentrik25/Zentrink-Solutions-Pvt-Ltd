import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Official Zentrik Solutions logo. The artwork has dark text, so on dark
 * backgrounds it sits on a white panel to stay legible.
 */
export function Logo({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <span className={cn("inline-flex", tone === "light" && "rounded-md bg-white p-3", className)}>
      <Image
        src="/logo.png"
        alt="Zentrik Solutions (Pvt) Ltd"
        width={1813}
        height={398}
        loading="eager"
        sizes="(min-width: 640px) 200px, 180px"
        className="h-10 w-auto sm:h-11"
      />
    </span>
  );
}
