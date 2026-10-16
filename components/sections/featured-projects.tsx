import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getFeaturedProjects } from "@/lib/data";
import { ButtonLink } from "@/components/ui/button";

export async function FeaturedProjects() {
  const featured = await getFeaturedProjects(3);

  if (featured.length === 0) {
    return (
      <div className="grid gap-8 border border-steel-300 bg-white p-8 lg:grid-cols-[1.4fr_1fr] lg:p-12">
        <div>
          <h3 className="text-2xl font-extrabold uppercase text-navy-900">
            Case studies are published once verified
          </h3>
          <p className="mt-4 max-w-2xl leading-relaxed text-steel-600">
            We publish a project only when its scope, specifications and photography have been
            confirmed. Verified case studies will appear here as they are released. To discuss
            your own project, send us your requirements.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3">
          <ButtonLink href="/request-a-quote">Request a Quote</ButtonLink>
          <ButtonLink href="/projects" variant="outline">
            Project Portfolio
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <ul className="grid gap-8 md:grid-cols-3">
      {featured.map((p) => (
        <li key={p.slug} className="border border-steel-300 bg-white">
          <Link href={`/projects/${p.slug}`} className="group block">
            {p.gallery[0] && (
              <Image
                src={p.gallery[0].src}
                alt={p.gallery[0].alt}
                width={p.gallery[0].width}
                height={p.gallery[0].height}
                sizes="(min-width: 768px) 33vw, 100vw"
                className="aspect-[4/3] w-full object-cover"
              />
            )}
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-strong">
                {p.category}
              </p>
              <h3 className="mt-2 text-xl font-extrabold uppercase text-navy-900">{p.title}</h3>
              <p className="mt-2 text-steel-600">{p.location}</p>
              <span className="mt-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy-900">
                View project <ArrowRight aria-hidden className="size-4" />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
