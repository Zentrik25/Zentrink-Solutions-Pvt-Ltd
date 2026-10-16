import { Mail, MapPin, Phone } from "lucide-react";
import { SITE } from "@/lib/site";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SingleLineDiagram } from "./single-line-diagram";

export function Hero() {
  return (
    <section className="bg-navy-900 text-white">
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-[1.25fr_1fr] lg:gap-16 lg:py-24">
        <div className="min-w-0">
          <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">
            <span aria-hidden className="h-0.5 w-8 bg-current" />
            Electrical engineering &middot; Zimbabwe
          </p>
          <h1 className="text-[2.4rem] font-black uppercase leading-[0.98] sm:text-6xl lg:text-7xl">
            Engineering reliable power solutions.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-steel-300">
            Professional electrical engineering, power distribution, solar energy and
            industrial electrical solutions for projects across Zimbabwe.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <ButtonLink href="/contact">Request a Project Quote</ButtonLink>
            <ButtonLink href="/services" variant="outline-light">
              Explore Our Services
            </ButtonLink>
          </div>
        </div>

        <div className="hidden border border-navy-700 lg:block">
          <SingleLineDiagram className="h-auto w-full" />
        </div>
      </Container>

      <div className="border-t border-navy-700">
        <Container className="grid gap-px text-sm sm:grid-cols-3">
          <a
            href={SITE.phoneHref}
            className="flex items-center gap-3 py-5 text-steel-300 hover:text-white"
          >
            <Phone aria-hidden className="size-4 text-accent" />
            {SITE.phone}
          </a>
          <a
            href={`mailto:${SITE.email}`}
            className="flex items-center gap-3 py-5 text-steel-300 hover:text-white"
          >
            <Mail aria-hidden className="size-4 text-accent" />
            {SITE.email}
          </a>
          <p className="flex items-center gap-3 py-5 text-steel-300">
            <MapPin aria-hidden className="size-4 text-accent" />
            Projects across {SITE.country}
          </p>
        </Container>
      </div>
    </section>
  );
}
