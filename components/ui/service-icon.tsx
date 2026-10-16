import { Gauge, Network, Package, Plug, Sun, Wrench } from "lucide-react";
import type { ServiceIcon as IconName } from "@/lib/services";

const icons = {
  plug: Plug,
  network: Network,
  sun: Sun,
  wrench: Wrench,
  gauge: Gauge,
  package: Package,
} as const;

export function ServiceIcon({ name, className }: { name: IconName; className?: string }) {
  const Icon = icons[name];
  return <Icon aria-hidden strokeWidth={1.5} className={className} />;
}
