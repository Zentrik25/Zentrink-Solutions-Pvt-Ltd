"use client";

import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SITE } from "@/lib/site";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="bg-navy-900 py-24 text-white">
      <Container>
        <p className="mb-4 t-label text-accent">Error</p>
        <h1 className="t-h1 max-w-3xl !text-white">
          Something went wrong
        </h1>
        <p className="mt-6 max-w-2xl t-lead !text-white/70">
          The page could not be loaded. Please try again, or contact us on{" "}
          <a href={SITE.phoneHref} className="text-white underline">
            {SITE.phone}
          </a>
          .
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-sm bg-accent px-5 py-2.5 text-[0.9375rem] text-navy-950 transition-colors hover:bg-[#e8590c]"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="min-h-11 rounded-sm border border-white/30 px-5 py-2.5 text-center text-[0.9375rem] hover:bg-white/10"
          >
            Return Home
          </Link>
        </div>
      </Container>
    </section>
  );
}
