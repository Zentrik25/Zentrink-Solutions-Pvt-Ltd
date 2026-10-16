import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SERVICES } from "@/lib/services";
import { ServiceIcon } from "@/components/ui/service-icon";

export function ServiceGrid() {
  return (
    <ul className="grid border-l border-t border-steel-300 md:grid-cols-2 lg:grid-cols-3">
      {SERVICES.map((s, i) => (
        <li key={s.slug} className="border-b border-r border-steel-300 bg-white">
          <Link
            href={`/services/${s.slug}`}
            className="group flex h-full flex-col transition-colors hover:bg-navy-900"
          >
            <Image
              src={s.image.src}
              alt={s.image.alt}
              width={s.image.width}
              height={s.image.height}
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="aspect-[16/9] w-full object-cover"
            />
            <div className="flex flex-1 flex-col p-8">
            <div className="flex items-start justify-between">
              <ServiceIcon
                name={s.icon}
                className="size-9 text-navy-900 group-hover:text-accent"
              />
              <span className="font-display text-sm font-bold text-steel-400">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-10 text-xl font-extrabold uppercase text-navy-900 group-hover:text-white">
              {s.title}
            </h3>
            <p className="mt-3 flex-1 leading-relaxed text-steel-600 group-hover:text-steel-300">
              {s.summary}
            </p>
            <span className="mt-8 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-accent-strong group-hover:text-accent">
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
