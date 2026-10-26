import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { getContact } from "@/lib/data";
import { TEAM } from "@/lib/team";
import { PageHero } from "@/components/ui/page-hero";
import { Section, SectionHeading } from "@/components/ui/section";
import { CtaBand } from "@/components/ui/cta-band";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = pageMetadata({
  title: "About Zentrik Solutions",
  description:
    "Company profile, mission, vision, values, engineering philosophy and our quality and safety commitments.",
  path: "/about",
});

const VALUES = [
  {
    title: "Safety first",
    text: "No schedule or price justifies unsafe work. Safe isolation, correct protection and tested systems come first.",
  },
  {
    title: "Technical integrity",
    text: "We design and install to recognised engineering practice, and we say so plainly when something does not meet it.",
  },
  {
    title: "Honest communication",
    text: "Clear scopes, realistic programmes and straightforward advice, including when the answer is not what a client hoped for.",
  },
  {
    title: "Accountability",
    text: "We stand behind our work and document it, so that clients know what was installed and how it was verified.",
  },
  {
    title: "Long-term reliability",
    text: "We specify and build for operation over years, not just for handover day.",
  },
];

const PHILOSOPHY = [
  {
    title: "Understand the load",
    text: "Every sound design begins with how the system will be used: connected load, demand, starting currents and future growth.",
  },
  {
    title: "Design before installing",
    text: "Cable sizes, protection and board layouts are worked out and documented before work begins on site.",
  },
  {
    title: "Verify, don't assume",
    text: "Installations are inspected and tested before they are energised, and the results are recorded.",
  },
  {
    title: "Leave it maintainable",
    text: "Clear labelling, schedules and documentation allow the people who operate the system to maintain it safely.",
  },
];

const COMMITMENTS = [
  {
    heading: "Quality",
    items: [
      "Work is carried out against a documented design and specification.",
      "Materials and equipment are selected for the duty and the environment.",
      "Every installation is inspected and tested before energisation.",
      "Test records and as-installed information are supplied at handover.",
    ],
  },
  {
    heading: "Safety",
    items: [
      "Safe isolation and lock-off procedures are used for work on electrical equipment.",
      "Work is planned around the hazards of each site, with clients informed of the arrangements.",
      "Suitable personal protective equipment, tools and test instruments are used.",
      "Defects and hazards that we find are reported to the client.",
    ],
  },
];

export default async function AboutPage() {
  const contact = await getContact();
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="A Zimbabwean electrical engineering company"
        intro="Zentrik Solutions (Pvt) Ltd designs, installs, tests and maintains electrical systems for commercial, industrial, institutional and residential clients."
        crumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      />

      <Section>
        <div className="grid gap-12 [&>*]:min-w-0 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
          <div>
            <SectionHeading eyebrow="Company profile" title="Who we are" />
            <div className="mt-8 space-y-5 text-lg leading-relaxed text-steel-600">
              <p>
                We specialise in electrical engineering, power distribution, solar installations,
                industrial electrical maintenance, testing and commissioning, and electrical
                equipment procurement.
              </p>
              <p>
                Our work is aimed at serious commercial, industrial, institutional and residential
                projects where reliability, safety and clear documentation matter. We take on work
                that we can scope, price and deliver properly.
              </p>
            </div>
          </div>
          <dl className="self-start rounded-lg border border-steel-200 bg-white p-6 shadow-card text-sm">
            {[
              ["Registered name", SITE.name],
              ["Industry", "Electrical engineering"],
              ["Country", SITE.country],
              ["Telephone", contact.phone],
              ["Email", contact.email],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[6.5rem_minmax(0,1fr)] sm:grid-cols-[8rem_minmax(0,1fr)] gap-4 border-b border-steel-200 py-4">
                <dt className="t-label text-steel-500">{k}</dt>
                <dd className="[overflow-wrap:anywhere] text-navy-950">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section tone="navy">
        <div className="grid gap-10 md:grid-cols-2 md:gap-0">
          <div className="md:border-r md:border-navy-700 md:pr-12">
            <h2 className="t-label text-accent">Mission</h2>
            <p className="mt-5 t-h2">
              To deliver safe, dependable and well-documented electrical engineering that clients can
              rely on for years.
            </p>
          </div>
          <div className="md:pl-12">
            <h2 className="t-label text-accent">Vision</h2>
            <p className="mt-5 t-h2">
              To be a trusted engineering partner for Zimbabwe&apos;s power, solar and industrial
              electrical projects.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading eyebrow="Our engineers" title="The people behind the work" />
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {TEAM.map((m) => (
            <li key={m.name} className="rounded-lg border border-steel-200 bg-white p-7 shadow-ambient">
              <div
                aria-hidden
                className="flex size-14 items-center justify-center rounded-md bg-navy-900 t-label text-white"
              >
                {m.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")}
              </div>
              <h3 className="mt-6 t-h3 text-navy-950">{m.name}</h3>
              <p className="mt-1 t-label text-accent-strong">
                {m.role}
              </p>
              {m.qualifications && <p className="mt-3 text-sm text-steel-600">{m.qualifications}</p>}
              {m.bio && <p className="mt-3 leading-relaxed text-steel-600">{m.bio}</p>}
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="muted">
        <SectionHeading eyebrow="Values" title="What we hold ourselves to" />
        <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((v) => (
            <li key={v.title} className="rounded-lg border border-steel-200 bg-white p-7 shadow-ambient">
              <h3 className="t-h3 text-navy-950">{v.title}</h3>
              <p className="mt-3 leading-relaxed text-steel-600">{v.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <SectionHeading
            eyebrow="Engineering philosophy"
            title="Design it, build it, prove it."
            intro="Four principles shape how we approach every project, whatever its size."
          />
          <ol className="border-t border-navy-900">
            {PHILOSOPHY.map((p, i) => (
              <li key={p.title} className="grid grid-cols-[3.5rem_1fr] border-b border-steel-200 py-7">
                <span className="t-label tnum text-accent-strong">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="t-h4 text-navy-950">{p.title}</h3>
                  <p className="mt-2 leading-relaxed text-steel-600">{p.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section tone="charcoal">
        <SectionHeading tone="charcoal" eyebrow="Our commitments" title="Quality and safety" />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {COMMITMENTS.map((c) => (
            <div key={c.heading} className="rounded-lg border border-white/10 bg-white/5 p-6">
              <h3 className="t-h3 !text-white">{c.heading}</h3>
              <ul className="mt-6 space-y-4">
                {c.items.map((item) => (
                  <li key={item} className="flex gap-4 leading-relaxed text-white/75">
                    <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12">
          <ButtonLink href="/services" variant="outline-light">
            See Our Services
          </ButtonLink>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
