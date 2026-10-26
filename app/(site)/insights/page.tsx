import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import {
  formatDate,
  readingMinutes,
} from "@/lib/articles";
import { getArticleCategories, getArticles } from "@/lib/data";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { CtaBand } from "@/components/ui/cta-band";
import { cn } from "@/lib/cn";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const base = {
    title: "Electrical Engineering Insights Zimbabwe",
    description:
      "Technical articles on electrical installations, solar energy, power systems, testing and maintenance from Zentrik Solutions.",
  };
  // Internal search results are thin, near-infinite URLs: keep them out of the index.
  if (sp.q?.trim()) return pageMetadata({ ...base, path: "/insights", noindex: true });
  const categories = await getArticleCategories();
  const category = categories.find((c) => c === sp.category);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const qs = new URLSearchParams();
  if (category) qs.set("category", category);
  if (page > 1) qs.set("page", String(page));
  const suffix = qs.toString() ? `?${qs}` : "";
  return pageMetadata({
    ...base,
    title: category ? `${category} Articles` : page > 1 ? `${base.title} (Page ${page})` : base.title,
    path: `/insights${suffix}`,
  });
}

const PAGE_SIZE = 6;

type Props = {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
};

function href(params: { q?: string; category?: string; page?: number }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.category) sp.set("category", params.category);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/insights?${qs}` : "/insights";
}

export default async function InsightsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [ARTICLES, ARTICLE_CATEGORIES] = await Promise.all([getArticles(), getArticleCategories()]);
  const q = (sp.q ?? "").trim().slice(0, 100);
  const category = ARTICLE_CATEGORIES.find((c) => c === sp.category);

  const needle = q.toLowerCase();
  const filtered = ARTICLES.filter((a) => {
    if (category && a.category !== category) return false;
    if (!needle) return true;
    const text = a.body
      .map((b) => (b.type === "ul" ? b.items.join(" ") : b.text))
      .join(" ");
    return `${a.title} ${a.excerpt} ${text}`.toLowerCase().includes(needle);
  }).sort((a, b) => b.published.localeCompare(a.published));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const requested = Number.parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), totalPages) : 1;
  const items = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHero
        eyebrow="Insights"
        title="Technical articles"
        intro="Practical engineering guidance on installations, solar energy, power systems, testing and maintenance."
        crumbs={[{ label: "Home", href: "/" }, { label: "Insights" }]}
      />

      <Section>
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <nav aria-label="Article categories" className="flex flex-wrap gap-2">
            {[undefined, ...ARTICLE_CATEGORIES].map((c) => {
              const selected = c === category;
              return (
                <Link
                  key={c ?? "all"}
                  href={href({ q, category: c })}
                  aria-current={selected ? "true" : undefined}
                  className={cn(
                    "rounded-sm border px-4 py-2 text-sm",
                    selected
                      ? "border-navy-900 bg-navy-900 text-white"
                      : "border-steel-200 text-steel-600 hover:border-accent",
                  )}
                >
                  {c ?? "All"}
                </Link>
              );
            })}
          </nav>

          <form action="/insights" role="search" className="flex w-full min-w-0 lg:w-96">
            {category && <input type="hidden" name="category" value={category} />}
            <label htmlFor="q" className="sr-only">
              Search articles
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              maxLength={100}
              placeholder="Search articles"
              className="min-w-0 flex-1 rounded-l-sm border border-r-0 border-steel-200 px-4 py-3 text-base placeholder:text-steel-500 focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-2 rounded-r-sm bg-navy-950 px-5 text-sm text-white hover:bg-navy-800"
            >
              <Search aria-hidden className="size-4" />
              Search
            </button>
          </form>
        </div>

        <p className="mb-6 text-sm text-steel-600" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "article" : "articles"}
          {q && <> matching &ldquo;{q}&rdquo;</>}
          {category && <> in {category}</>}
        </p>

        {items.length === 0 ? (
          <div className="border border-steel-200 p-10">
            <h2 className="t-h3 text-navy-950">No articles found</h2>
            <p className="mt-3 text-steel-600">
              Try a different search term or category.
            </p>
            <Link
              href="/insights"
              className="mt-6 inline-block text-accent-strong underline underline-offset-4"
            >
              View all articles
            </Link>
          </div>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/insights/${a.slug}`}
                  className="group flex h-full flex-col rounded-lg border border-steel-200 bg-white p-7 shadow-ambient transition-all hover:-translate-y-0.5 hover:shadow-elevated"
                >
                  <p className="t-label text-accent-strong">
                    {a.category}
                  </p>
                  <h2 className="mt-4 t-h3 text-navy-950 group-hover:text-accent-strong">
                    {a.title}
                  </h2>
                  <p className="mt-3 flex-1 leading-relaxed text-steel-600">{a.excerpt}</p>
                  <p className="mt-6 flex items-center justify-between text-sm text-steel-500">
                    <span>
                      {formatDate(a.published)} &middot; {readingMinutes(a)} min read
                    </span>
                    <ArrowRight aria-hidden className="size-4 text-navy-900" />
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center gap-2">
            {page > 1 && (
              <Link
                href={href({ q, category, page: page - 1 })}
                rel="prev"
                className="rounded-sm border border-steel-200 px-4 py-2 text-sm hover:border-accent"
              >
                Previous
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={href({ q, category, page: n })}
                aria-current={n === page ? "page" : undefined}
                aria-label={`Page ${n}`}
                className={cn(
                  "min-w-11 rounded-sm border px-4 py-2 text-center text-sm",
                  n === page
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-steel-200 hover:border-navy-900",
                )}
              >
                {n}
              </Link>
            ))}
            {page < totalPages && (
              <Link
                href={href({ q, category, page: page + 1 })}
                rel="next"
                className="rounded-sm border border-steel-200 px-4 py-2 text-sm hover:border-accent"
              >
                Next
              </Link>
            )}
          </nav>
        )}
      </Section>

      <CtaBand title="Have a technical question about your project?" />
    </>
  );
}
