import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getProjects, getService } from "@/lib/data";
import { PageHero } from "@/components/ui/page-hero";
import { Section, SectionHeading } from "@/components/ui/section";
import { CtaBand } from "@/components/ui/cta-band";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};
  return pageMetadata({
    title: project.seo?.title ?? project.title,
    description: project.seo?.description ?? project.summary,
    path: `/projects/${project.slug}`,
  });
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const [lead, ...rest] = project.gallery;
  const serviceLinks = await Promise.all(project.services.map((s) => getService(s)));

  return (
    <>
      <PageHero
        eyebrow={project.category}
        title={project.title}
        intro={project.summary}
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Projects", href: "/projects" },
          { label: project.title },
        ]}
      />

      {lead && (
        <div className="bg-steel-100">
          <Image
            src={lead.src}
            alt={lead.alt}
            width={lead.width}
            height={lead.height}
            fetchPriority="high"
            loading="eager"
            sizes="100vw"
            className="mx-auto max-h-[36rem] w-full max-w-7xl object-cover"
          />
        </div>
      )}

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
          <div>
            <SectionHeading eyebrow="Project description" title="Scope and delivery" />
            <div className="mt-8 space-y-5 text-lg leading-relaxed text-steel-600">
              {project.description.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            {project.services.length > 0 && (
              <p className="mt-8 text-sm">
                <span className="t-label text-steel-500">Services: </span>
                {serviceLinks.map((svc, i) => {
                  if (!svc) return null;
                  return (
                    <span key={svc.slug}>
                      {i > 0 && ", "}
                      <Link href={`/services/${svc.slug}`} className="text-accent-strong underline underline-offset-4">
                        {svc.title}
                      </Link>
                    </span>
                  );
                })}
              </p>
            )}
          </div>
          <div className="self-start">
            <h2 className="border-b border-steel-200 pb-3 t-label text-steel-500">
              Technical specifications
            </h2>
            <dl className="text-sm">
              {[
                ["Location", project.location],
                ["Year", project.year],
                ...(project.client ? [["Client", project.client]] : []),
                ...project.specifications.map((s) => [s.label, s.value]),
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[9rem_1fr] gap-4 border-t border-steel-200 py-3">
                  <dt className="text-steel-500">{k}</dt>
                  <dd className="text-navy-950">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Section>

      {rest.length > 0 && (
        <Section tone="muted">
          <SectionHeading eyebrow="Gallery" title="Project images" />
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((img) => (
              <li key={img.src}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={img.width}
                  height={img.height}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="aspect-[4/3] w-full object-cover"
                />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <CtaBand title="Planning a similar project?" />
    </>
  );
}
