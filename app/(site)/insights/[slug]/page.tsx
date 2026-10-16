import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, readingMinutes } from "@/lib/articles";
import { getArticle, getArticles } from "@/lib/data";
import { SITE } from "@/lib/site";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { CtaBand } from "@/components/ui/cta-band";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getArticles()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};
  return {
    title: article.seo?.title ?? article.title,
    description: article.seo?.description ?? article.excerpt,
    alternates: { canonical: `/insights/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      url: `/insights/${article.slug}`,
      publishedTime: article.published,
      section: article.category,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const ARTICLES = await getArticles();
  const more = ARTICLES.filter(
    (a) => a.slug !== article.slug && a.category === article.category,
  ).concat(ARTICLES.filter((a) => a.slug !== article.slug && a.category !== article.category))
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.published,
    articleSection: article.category,
    author: { "@type": "Organization", name: SITE.name },
    publisher: { "@type": "Organization", name: SITE.name },
    mainEntityOfPage: `${SITE.url}/insights/${article.slug}`,
  };

  return (
    <>
      <PageHero
        eyebrow={article.category}
        title={article.title}
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Insights", href: "/insights" },
          { label: article.title },
        ]}
      >
        <p className="text-sm text-steel-300">
          <time dateTime={article.published}>{formatDate(article.published)}</time> &middot;{" "}
          {readingMinutes(article)} min read &middot; {SITE.shortName}
        </p>
      </PageHero>

      <Section>
        <article className="mx-auto max-w-3xl">
          <p className="border-l-4 border-accent pl-6 text-xl leading-relaxed text-charcoal-700">
            {article.excerpt}
          </p>
          <div className="mt-10 space-y-6 text-lg leading-relaxed text-charcoal-800">
            {article.body.map((block, i) => {
              if (block.type === "h2")
                return (
                  <h2 key={i} className="!mt-12 text-2xl font-extrabold uppercase text-navy-900">
                    {block.text}
                  </h2>
                );
              if (block.type === "ul")
                return (
                  <ul key={i} className="space-y-3">
                    {block.items.map((item) => (
                      <li key={item} className="flex gap-4">
                        <span aria-hidden className="mt-3 size-1.5 shrink-0 bg-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                );
              return <p key={i}>{block.text}</p>;
            })}
          </div>
          <p className="mt-12 border-t border-steel-300 pt-6 text-sm text-steel-600">
            This article is general technical guidance. Every installation differs, so design
            decisions should be confirmed against the site conditions and the applicable standards.
          </p>
        </article>
      </Section>

      <Section tone="muted">
        <h2 className="text-2xl font-extrabold uppercase text-navy-900">More articles</h2>
        <ul className="mt-8 grid border-l border-t border-steel-300 bg-white md:grid-cols-3">
          {more.map((a) => (
            <li key={a.slug} className="border-b border-r border-steel-300">
              <Link href={`/insights/${a.slug}`} className="group block h-full p-6 hover:bg-navy-900">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-strong group-hover:text-accent">
                  {a.category}
                </p>
                <h3 className="mt-3 text-lg font-extrabold leading-tight text-navy-900 group-hover:text-white">
                  {a.title}
                </h3>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
