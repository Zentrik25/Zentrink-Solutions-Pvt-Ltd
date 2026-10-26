import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getServices } from "@/lib/data";
import { ServiceIcon } from "@/components/ui/service-icon";

export async function ServiceGrid() {
  const SERVICES = await getServices();
  return (
    <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {SERVICES.map((s, i) => (
        <li key={s.slug}>
          <Link
            href={`/services/${s.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-lg border border-steel-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
          >
            <div className="relative overflow-hidden">
              <Image
                src={s.image.src}
                alt={s.image.alt}
                width={s.image.width}
                height={s.image.height}
                sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
                className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <span className="t-label tnum absolute left-3 top-3 rounded-sm bg-white/90 px-2 py-1 text-navy-950 backdrop-blur-sm">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-md bg-accent/10 text-accent-strong">
                  <ServiceIcon name={s.icon} className="size-5" />
                </span>
                <h3 className="t-h3 text-navy-950">{s.title}</h3>
              </div>
              <p className="mt-4 flex-1 text-[0.9375rem] leading-relaxed text-steel-500">{s.summary}</p>
              <span className="mt-5 flex items-center gap-1.5 text-sm text-accent-strong">
                View service
                <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
