export type Industry = {
  slug: string;
  title: string;
  summary: string;
  needs: string[];
  services: string[];
  challenges: string[];
  approach: string[];
  faqs: { q: string; a: string }[];
};

const BASE_INDUSTRIES: Omit<Industry, "challenges" | "approach" | "faqs">[] = [
  {
    slug: "mining",
    title: "Mining",
    summary:
      "Mining and mineral processing depend on continuous, safe electrical supply in demanding environments. Distribution must cope with large motor loads, long cable runs and dust, heat and vibration.",
    needs: [
      "Medium and low-voltage distribution to plant, shafts and remote areas",
      "Motor control centres and large motor starting arrangements",
      "Protection and earthing suited to harsh environments",
      "Solar and hybrid supply for remote or off-grid operations",
    ],
    services: [
      "power-distribution",
      "industrial-maintenance",
      "solar-energy",
    ],
  },
  {
    slug: "manufacturing",
    title: "Manufacturing",
    summary:
      "Production lines depend on stable power and dependable controls. Electrical systems must be maintainable, with clear documentation and minimal unplanned downtime.",
    needs: [
      "Factory distribution boards and machine supplies",
      "Power factor correction and load management",
      "Planned maintenance aligned to production schedules",
      "Standby supply and changeover arrangements",
    ],
    services: [
      "electrical-installations",
      "industrial-maintenance",
      "testing-commissioning",
    ],
  },
  {
    slug: "agriculture",
    title: "Agriculture",
    summary:
      "Farms and agro-processors rely on power for irrigation, cold storage and processing, often far from the grid. Reliable supply protects crops, product and productivity.",
    needs: [
      "Irrigation pump supplies and motor protection",
      "Solar PV for pumping and processing loads",
      "Cold room and packhouse electrical installations",
      "Distribution across estates and outbuildings",
    ],
    services: [
      "solar-energy",
      "power-distribution",
      "electrical-installations",
    ],
  },
  {
    slug: "construction",
    title: "Construction",
    summary:
      "Contractors and developers need electrical packages delivered to programme, with temporary supplies, coordinated design and test records that support practical completion.",
    needs: [
      "Temporary site supplies and builders' distribution",
      "Electrical sub-contract packages for building projects",
      "Design coordination with architects and other trades",
      "Testing and certification for handover",
    ],
    services: [
      "electrical-installations",
      "testing-commissioning",
      "electrical-procurement",
    ],
  },
  {
    slug: "commercial-buildings",
    title: "Commercial Buildings",
    summary:
      "Offices, retail and hospitality premises need installations that are safe, efficient and flexible. Lighting, small power and standby supplies should support the way the building is used.",
    needs: [
      "Lighting and small-power installations",
      "Main and floor distribution boards",
      "Solar PV and battery backup for operating costs and resilience",
      "Upgrades to existing building electrical systems",
    ],
    services: [
      "electrical-installations",
      "solar-energy",
      "testing-commissioning",
    ],
  },
  {
    slug: "residential-developments",
    title: "Residential Developments",
    summary:
      "From a single home to a multi-unit development, residential electrical work must be safe, compliant and properly documented, with provision for future solar and storage.",
    needs: [
      "House wiring and consumer unit installations",
      "Reticulation for multi-unit developments",
      "Solar and backup power for homes",
      "Inspection and testing for completion",
    ],
    services: [
      "electrical-installations",
      "solar-energy",
      "power-distribution",
    ],
  },
  {
    slug: "public-infrastructure",
    title: "Public Infrastructure",
    summary:
      "Schools, clinics, water works and municipal facilities serve communities and must keep running. Electrical systems need to be robust, maintainable and well documented.",
    needs: [
      "Electrical supplies to pumping and treatment stations",
      "Institutional building installations",
      "Solar and backup power for critical services",
      "Maintenance programmes for public facilities",
    ],
    services: [
      "power-distribution",
      "industrial-maintenance",
      "solar-energy",
    ],
  },
];

type Detail = Pick<Industry, "challenges" | "approach" | "faqs">;

const DETAILS: Record<string, Detail> = {
  mining: {
    challenges: [
      "Large motors with high starting currents and long cable runs that make voltage drop a design constraint",
      "Dust, moisture, vibration and heat that shorten the life of enclosures, connections and cabling",
      "Remote sites where supply is weak or unavailable and repairs are slow to arrange",
    ],
    approach: [
      "Size cables and protection for starting duty and verify voltage drop at the furthest load.",
      "Specify enclosures and cable glands with ingress protection suited to the site conditions.",
      "Plan solar and hybrid supply for remote or off-grid loads, with generator integration where needed.",
    ],
    faqs: [
      {
        q: "Can you supply remote or off-grid mining operations?",
        a: "Yes. We assess the load and design a solar, battery and generator arrangement sized to the site. The right mix depends on load profile, fuel logistics and how critical continuity of supply is.",
      },
      {
        q: "Do you carry out shutdown maintenance?",
        a: "Maintenance can be planned around scheduled shutdowns, with isolations, permits and test records agreed in advance with the site.",
      },
    ],
  },
  manufacturing: {
    challenges: [
      "Production losses when supply or distribution equipment fails without warning",
      "Low power factor and harmonics from motors and drives that strain the network",
      "Plant layouts that change over time while documentation does not",
    ],
    approach: [
      "Survey the existing installation and record boards, circuits and loads.",
      "Plan maintenance and testing around production schedules and shutdown windows.",
      "Assess power factor and recommend correction only where it pays back.",
    ],
    faqs: [
      {
        q: "Can you work without stopping production?",
        a: "Some inspection, such as visual checks and thermal imaging, can be done on live equipment under suitable safety conditions. Work that needs isolation is scheduled for agreed windows.",
      },
      {
        q: "Can you update our electrical drawings and schedules?",
        a: "Yes. A condition survey can include producing board schedules and single-line information for the installed system.",
      },
    ],
  },
  agriculture: {
    challenges: [
      "Irrigation and processing loads that are seasonal and often far from the grid",
      "Long distribution routes across estates, with exposure to weather and animals",
      "Cold storage and packhouse loads that cannot tolerate long interruptions",
    ],
    approach: [
      "Match solar array and storage to pumping or processing loads and operating hours.",
      "Protect motors and pumps against overload, phase loss and supply variation.",
      "Design distribution routes and protection for long cable runs and outdoor conditions.",
    ],
    faqs: [
      {
        q: "Can solar run irrigation pumps directly?",
        a: "Yes, solar pumping systems are well established. The design depends on pump size, head, flow requirements and whether storage or grid support is needed.",
      },
      {
        q: "Do you cover cold rooms and packhouses?",
        a: "We install and maintain the electrical supply, distribution and protection for cold storage and processing buildings, and can advise on standby arrangements.",
      },
    ],
  },
  construction: {
    challenges: [
      "Electrical packages that must fit tight programmes and follow other trades",
      "Design coordination between architects, engineers and installers",
      "Test records and documentation required before practical completion",
    ],
    approach: [
      "Agree the electrical scope, specification and programme at the outset.",
      "Coordinate containment routes and board locations with the wider design.",
      "Complete inspection, testing and handover documentation as part of the package.",
    ],
    faqs: [
      {
        q: "Do you work as an electrical sub-contractor?",
        a: "Yes. We can take on the electrical package for building and infrastructure projects. Send us the drawings and specification and we will confirm what we need to price it.",
      },
      {
        q: "Can you provide temporary site supplies?",
        a: "We can design and install builders' distribution and temporary supplies for construction sites.",
      },
    ],
  },
  "commercial-buildings": {
    challenges: [
      "Rising operating costs and supply interruptions that affect trading",
      "Fit-outs and tenant changes that overload original distribution",
      "Lighting and small-power layouts that must be flexible and safe",
    ],
    approach: [
      "Assess existing capacity before adding load or solar.",
      "Provide clearly labelled boards and circuit schedules for facilities teams.",
      "Size solar and backup to the loads that matter most to the business.",
    ],
    faqs: [
      {
        q: "Can you upgrade the electrics of an occupied building?",
        a: "Yes. We phase the work and agree isolation windows with the occupier to keep disruption short.",
      },
      {
        q: "Is solar suitable for an office or retail premises?",
        a: "Often, where there is roof space and daytime consumption. We assess your load profile and recommend a system, or tell you if the case is weak.",
      },
    ],
  },
  "residential-developments": {
    challenges: [
      "Consistent, compliant installations across many units",
      "Provision for future solar and storage without costly rework",
      "Clear documentation for owners and for completion",
    ],
    approach: [
      "Standardise board layouts and circuit schedules across unit types.",
      "Include containment and board space for later solar and backup power.",
      "Inspect, test and document each installation before handover.",
    ],
    faqs: [
      {
        q: "Do you work on individual homes?",
        a: "Yes, from house wiring and board upgrades to solar and backup power for a single home.",
      },
      {
        q: "Can you design reticulation for a housing development?",
        a: "We design and install on-site distribution, and prepare the technical information needed for supply connection applications.",
      },
    ],
  },
  "public-infrastructure": {
    challenges: [
      "Facilities that must stay in service, such as pumping stations, clinics and schools",
      "Limited maintenance budgets and ageing electrical equipment",
      "Procurement processes that require clear specifications and documentation",
    ],
    approach: [
      "Survey and prioritise equipment by criticality and condition.",
      "Prepare clear scopes, specifications and bills for procurement review.",
      "Provide backup and solar supply for critical services where it is justified.",
    ],
    faqs: [
      {
        q: "Can you respond to tenders and formal procurement?",
        a: "Yes. Contact us with the tender documents and we will confirm whether we can respond and what information is required.",
      },
      {
        q: "Can you help us prioritise electrical repairs?",
        a: "A condition survey produces a prioritised report that ranks defects by safety risk and operational importance.",
      },
    ],
  },
};

export const INDUSTRIES: Industry[] = BASE_INDUSTRIES.map((i) => ({
  ...i,
  ...DETAILS[i.slug],
}));
