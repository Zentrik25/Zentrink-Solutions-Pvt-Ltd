import { Mail, MapPin, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import Image from "next/image";

export function Hero({
  headline,
  text,
  contact,
}: {
  headline: string;
  text: string;
  contact: { phone: string; phoneHref: string; email: string };
}) {
  return (
    <section className="bg-navy-900 text-white">
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-[1.25fr_1fr] lg:gap-16 lg:py-24">
        <div className="min-w-0">
          <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">
            <span aria-hidden className="h-0.5 w-8 bg-current" />
            Electrical engineering &middot; Zimbabwe
          </p>
          <h1 className="text-[2.4rem] font-black uppercase leading-[0.98] sm:text-6xl lg:text-7xl">
            {headline}
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-steel-300">{text}</p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <ButtonLink href="/request-a-quote">Request a Project Quote</ButtonLink>
            <ButtonLink href="/services" variant="outline-light">
              Explore Our Services
            </ButtonLink>
          </div>
        </div>

        <div className="border-b-4 border-accent">
          <Image
            src="/images/power-transformer.jpg"
            alt="Power transformer and switchgear at an electrical substation"
            width={1800}
            height={1350}
            fetchPriority="high"
            loading="eager"
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="aspect-[4/3] w-full object-cover lg:aspect-[4/5]"
          />
        </div>
      </Container>

      <div className="border-t border-navy-700">
        <Container className="grid gap-px text-sm sm:grid-cols-3">
          <a
            href={contact.phoneHref}
            className="flex items-center gap-3 py-5 text-steel-300 hover:text-white"
          >
            <Phone aria-hidden className="size-4 text-accent" />
            {contact.phone}
          </a>
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-3 py-5 text-steel-300 hover:text-white"
          >
            <Mail aria-hidden className="size-4 text-accent" />
            {contact.email}
          </a>
          <p className="flex items-center gap-3 py-5 text-steel-300">
            <MapPin aria-hidden className="size-4 text-accent" />
            Projects across Zimbabwe
          </p>
        </Container>
      </div>
    </section>
  );
}
