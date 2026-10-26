import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { HeroArt } from "@/components/ui/page-hero";
import { Pill } from "@/components/ui/section";

const DISCIPLINES = ["Installations", "Power distribution", "Solar energy", "Maintenance", "Testing and commissioning", "Procurement"];

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
    <section className="relative overflow-hidden border-b border-steel-200 bg-steel-50">
      <HeroArt />
      <Container className="relative grid items-center gap-14 py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:py-24">
        <div className="min-w-0">
          <Pill className="mb-7">Electrical engineering &middot; Zimbabwe</Pill>
          <h1 className="t-display text-navy-950">{headline}</h1>
          <p className="t-lead mt-6 max-w-xl text-steel-500">{text}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/request-a-quote">Request a Project Quote</ButtonLink>
            <ButtonLink href="/services" variant="outline">
              Explore Our Services
            </ButtonLink>
          </div>
          <ul className="mt-10 flex flex-col gap-3 text-sm text-steel-500 sm:flex-row sm:flex-wrap sm:gap-x-7">
            <li>
              <a href={contact.phoneHref} className="flex items-center gap-2 hover:text-navy-950">
                <Phone aria-hidden className="size-4 text-accent-strong" />
                <span className="tnum">{contact.phone}</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-navy-950">
                <Mail aria-hidden className="size-4 text-accent-strong" />
                {contact.email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin aria-hidden className="size-4 text-accent-strong" />
              Projects across Zimbabwe
            </li>
          </ul>
        </div>

        {/* Layered photo composition: main card, offset second card, floating info card */}
        <div className="relative lg:h-[34rem]">
          <div className="overflow-hidden rounded-lg border border-white shadow-elevated lg:absolute lg:right-0 lg:top-0 lg:w-[80%]">
            <Image
              src="/images/power-transformer.jpg"
              alt="Power transformer and switchgear at an electrical substation"
              width={1800}
              height={1350}
              fetchPriority="high"
              loading="eager"
              sizes="(min-width: 1024px) 460px, 100vw"
              className="aspect-[16/11] w-full object-cover lg:aspect-[4/5]"
            />
          </div>
          <div className="absolute bottom-0 left-0 hidden w-[52%] overflow-hidden rounded-lg border-4 border-white shadow-deep lg:block">
            <Image
              src="/images/solar-array.jpg"
              alt="Rows of ground-mounted solar PV panels"
              width={1800}
              height={1198}
              sizes="280px"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div className="absolute left-0 top-12 hidden w-56 rounded-lg border border-steel-200 bg-white p-4 shadow-elevated xl:block">
            <p className="t-label text-steel-500">Six disciplines</p>
            <ul className="mt-3 space-y-2 text-[0.8125rem] text-navy-950">
              {DISCIPLINES.map((d) => (
                <li key={d} className="flex items-center gap-2">
                  <span aria-hidden className="size-1.5 rounded-xs bg-accent" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
