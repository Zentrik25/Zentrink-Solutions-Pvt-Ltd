import type { Metadata } from "next";
import { absoluteUrl, jsonLd as safeJsonLd, pageMetadata } from "@/lib/seo";
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
  return pageMetadata({
    title: article.seo?.title ?? article.title,
    description: article.seo?.description ?? article.excerpt,
    path: `/insights/${article.slug}`,
    type: "article",
    publishedTime: article.published,
    section: article.category,
  });
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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.published,
    dateModified: article.published,
    articleSection: article.category,
    inLanguage: "en",
    image: absoluteUrl(`/insights/${article.slug}/opengraph-image`),
    author: { "@type": "Organization", name: SITE.name },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png") },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(`/insights/${article.slug}`) },
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
          <p className="t-lead border-l-2 border-accent pl-6">
            {article.excerpt}
          </p>
          <div className="mt-10 space-y-6 text-[1.0625rem] leading-relaxed text-steel-600">
            {article.body.map((block, i) => {
              if (block.type === "h2")
                return (
                  <h2 key={i} className="!mt-12 t-h3 text-navy-950">
                    {block.text}
                  </h2>
                );
              if (block.type === "ul")
                return (
                  <ul key={i} className="space-y-3">
                    {block.items.map((item) => (
                      <li key={item} className="flex gap-4">
                        <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                );
              return <p key={i}>{block.text}</p>;
            })}
          </div>
          <p className="mt-12 border-t border-steel-200 pt-6 text-sm text-steel-600">
            This article is general technical guidance. Every installation differs, so design
            decisions should be confirmed against the site conditions and the applicable standards.
          </p>
        </article>
      </Section>

      <Section tone="muted">
        <h2 className="t-h3 text-navy-950">More articles</h2>
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {more.map((a) => (
            <li key={a.slug}>
              <Link href={`/insights/${a.slug}`} className="group block h-full rounded-lg border border-steel-200 p-6 transition-shadow hover:shadow-elevated">
                <p className="t-label text-accent-strong group-hover:text-accent">
                  {a.category}
                </p>
                <h3 className="mt-3 t-h4 text-navy-950 group-hover:text-accent-strong">
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
        dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }}
      />
    </>
  );
}
