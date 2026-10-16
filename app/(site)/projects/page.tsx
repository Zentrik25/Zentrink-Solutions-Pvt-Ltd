import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PROJECT_CATEGORIES } from "@/lib/projects";
import { getProjects } from "@/lib/data";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { CtaBand } from "@/components/ui/cta-band";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Verified electrical engineering projects by Zentrik Solutions, with specifications and photography.",
  alternates: { canonical: "/projects" },
};

type Props = { searchParams: Promise<{ category?: string }> };

export default async function ProjectsPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const PROJECTS = await getProjects();
  const active = PROJECT_CATEGORIES.find((c) => c === category);
  const visible = active ? PROJECTS.filter((p) => p.category === active) : PROJECTS;

  return (
    <>
      <PageHero
        eyebrow="Projects"
        title="Project portfolio"
        intro="Completed work, documented with its scope and technical specifications."
        crumbs={[{ label: "Home", href: "/" }, { label: "Projects" }]}
      />

      <Section>
        {PROJECTS.length === 0 ? (
          <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
            <div>
              <h2 className="text-3xl font-extrabold uppercase leading-tight text-navy-900 sm:text-4xl">
                Verified case studies are being prepared.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-steel-600">
                We publish a project only after its scope, specifications and photography have been
                confirmed, so this portfolio contains no placeholder or unverified work. Each case
                study will list its category, location, technical specifications and image gallery.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <ButtonLink href="/request-a-quote">Request a Quote</ButtonLink>
                <ButtonLink href="/services" variant="outline">
                  Explore Our Services
                </ButtonLink>
              </div>
            </div>
            <div className="self-start border-t-4 border-navy-900">
              <h3 className="py-4 text-xs font-bold uppercase tracking-[0.2em] text-steel-500">
                Project categories
              </h3>
              <ul>
                {PROJECT_CATEGORIES.map((c) => (
                  <li key={c} className="border-t border-steel-300 py-4 font-bold text-navy-900">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <>
            <nav aria-label="Project categories" className="mb-12 flex flex-wrap gap-2">
              {[undefined, ...PROJECT_CATEGORIES].map((c) => {
                const selected = c === active;
                return (
                  <Link
                    key={c ?? "all"}
                    href={c ? `/projects?category=${encodeURIComponent(c)}` : "/projects"}
                    aria-current={selected ? "true" : undefined}
                    className={cn(
                      "border-2 px-4 py-2 text-xs font-bold uppercase tracking-wider",
                      selected
                        ? "border-navy-900 bg-navy-900 text-white"
                        : "border-steel-300 text-charcoal-700 hover:border-navy-900",
                    )}
                  >
                    {c ?? "All"}
                  </Link>
                );
              })}
            </nav>
            {visible.length === 0 ? (
              <p className="text-lg text-steel-600">No projects in this category yet.</p>
            ) : (
              <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {visible.map((p) => (
                  <li key={p.slug} className="border border-steel-300">
                    <Link href={`/projects/${p.slug}`} className="group block">
                      {p.gallery[0] && (
                        <Image
                          src={p.gallery[0].src}
                          alt={p.gallery[0].alt}
                          width={p.gallery[0].width}
                          height={p.gallery[0].height}
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          className="aspect-[4/3] w-full object-cover"
                        />
                      )}
                      <div className="p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-strong">
                          {p.category}
                        </p>
                        <h2 className="mt-2 text-xl font-extrabold uppercase text-navy-900 group-hover:text-accent-strong">
                          {p.title}
                        </h2>
                        <p className="mt-2 text-sm text-steel-600">
                          {p.location} &middot; {p.year}
                        </p>
                        <p className="mt-4 leading-relaxed text-steel-600">{p.summary}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Section>

      <CtaBand />
    </>
  );
}
