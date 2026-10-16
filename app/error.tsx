"use client";

import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SITE } from "@/lib/site";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="bg-navy-900 py-24 text-white">
      <Container>
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-accent">Error</p>
        <h1 className="max-w-3xl text-4xl font-extrabold uppercase leading-[1.02] sm:text-5xl">
          Something went wrong
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-steel-300">
          The page could not be loaded. Please try again, or contact us on{" "}
          <a href={SITE.phoneHref} className="font-bold text-white underline">
            {SITE.phone}
          </a>
          .
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="border-2 border-accent bg-accent px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-navy-950 hover:bg-accent-strong hover:text-white"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="border-2 border-white px-6 py-3.5 text-center text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-navy-900"
          >
            Return Home
          </Link>
        </div>
      </Container>
    </section>
  );
}
