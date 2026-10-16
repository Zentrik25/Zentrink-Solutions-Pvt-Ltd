export type ServiceIcon =
  | "plug"
  | "network"
  | "sun"
  | "wrench"
  | "gauge"
  | "package";

export type ServiceImage = { src: string; alt: string; width: number; height: number };

export type Service = {
  image: ServiceImage;
  slug: string;
  title: string;
  icon: ServiceIcon;
  summary: string;
  overview: string[];
  scope: string[];
  applications: string[];
  process: { title: string; text: string }[];
  related: string[];
  faqs: { q: string; a: string }[];
};

const BASE_SERVICES: Omit<Service, "image">[] = [
  {
    slug: "electrical-installations",
    title: "Electrical Installations",
    icon: "plug",
    summary:
      "Design-led low-voltage installations for commercial, industrial, institutional and residential buildings.",
    overview: [
      "A dependable installation starts long before the first cable is pulled. We plan load, circuit arrangement, protection and containment around how the building will actually be used, then install to a documented design.",
      "Our installations cover power, lighting and small-power distribution, distribution boards, earthing and bonding, and the supporting containment and cabling. Work is set out, supervised and inspected against the specification so that what is handed over matches what was designed.",
    ],
    scope: [
      "Main and sub-distribution boards, including incomers, isolation and protective devices",
      "Power, lighting and small-power circuits for new buildings and refurbishments",
      "Cable containment: conduit, trunking, tray and ladder",
      "Earthing, bonding and lightning protection coordination",
      "Emergency and standby lighting circuits",
      "Load assessment and circuit schedules prepared for each distribution board",
      "Final inspection, circuit labelling and as-installed documentation",
    ],
    applications: [
      "New commercial and office buildings",
      "Factories, workshops and warehouses",
      "Schools, clinics and institutional buildings",
      "Residential developments and individual homes",
      "Refurbishment and electrical upgrades of existing premises",
    ],
    process: [
      {
        title: "Brief and load assessment",
        text: "We establish the building use, connected load, future expansion and supply constraints.",
      },
      {
        title: "Design and specification",
        text: "Circuit layout, protection, cable sizing and board schedules are prepared before work begins.",
      },
      {
        title: "Installation",
        text: "Containment, cabling and boards are installed and supervised against the approved design.",
      },
      {
        title: "Inspection and testing",
        text: "Every circuit is inspected and tested before it is energised.",
      },
      {
        title: "Handover",
        text: "Test records, schedules and as-installed information are supplied to the client.",
      },
    ],
    related: [
      "electrical-testing-and-commissioning",
      "power-distribution-infrastructure",
      "electrical-equipment-procurement",
    ],
    faqs: [
      {
        q: "Can you work from our existing drawings?",
        a: "Yes. If you already have architectural or electrical drawings we will review them, confirm the load and protection requirements, and raise any queries before pricing. If drawings do not exist we can prepare the electrical design as part of the project.",
      },
      {
        q: "Do you handle refurbishments of occupied buildings?",
        a: "Refurbishment is planned around the client's operations. We agree isolation windows and phasing in advance so that supply is interrupted for as short a period as practical.",
      },
      {
        q: "Will we receive test records at handover?",
        a: "Yes. Inspection and test records, circuit schedules and as-installed information are part of the handover package.",
      },
      {
        q: "How do I get a quotation?",
        a: "Send us the project location, a description of the work and any drawings through the enquiry form. We will confirm what additional information is needed and, where required, arrange a site visit.",
      },
    ],
  },
  {
    slug: "power-distribution-infrastructure",
    title: "Power Distribution Infrastructure",
    icon: "network",
    summary:
      "Medium and low-voltage distribution networks, transformers, switchgear and cabling for sites that need dependable supply.",
    overview: [
      "Distribution infrastructure carries power from the point of supply to every load on a site. Its design determines voltage quality, fault tolerance and how safely the network can be operated and maintained.",
      "We engineer and install distribution networks from the supply connection to the final distribution board, including transformers, switchgear, underground and overhead cabling, and the protection coordination that keeps faults local and supply stable.",
    ],
    scope: [
      "Site distribution network design, including load flow and voltage drop checks",
      "Transformer and mini-substation installation, with civil interface coordination",
      "Low-voltage and medium-voltage switchgear and main switchboard installation",
      "Underground cable and overhead line installation and termination",
      "Protection settings and coordination with upstream supply requirements",
      "Power factor correction equipment",
      "Standby generator integration and changeover arrangements",
    ],
    applications: [
      "Mining and processing sites",
      "Industrial parks and manufacturing plants",
      "Agricultural estates and irrigation schemes",
      "Housing and mixed-use developments",
      "Municipal and public infrastructure",
    ],
    process: [
      {
        title: "Supply and load study",
        text: "We confirm supply availability, demand, diversity and future growth.",
      },
      {
        title: "Network design",
        text: "Route, conductor, protection and equipment selection are documented for approval.",
      },
      {
        title: "Procurement and delivery",
        text: "Equipment is specified and sourced to the approved design, with delivery planned against the programme.",
      },
      {
        title: "Installation and termination",
        text: "Equipment is installed, cabled and terminated under supervision.",
      },
      {
        title: "Testing and energisation",
        text: "Pre-energisation tests are completed and records issued before the network is brought into service.",
      },
    ],
    related: [
      "electrical-testing-and-commissioning",
      "industrial-electrical-maintenance",
      "electrical-equipment-procurement",
    ],
    faqs: [
      {
        q: "Do you coordinate with the supply authority?",
        a: "We prepare the technical information that supply connection applications typically require and coordinate the electrical interface with the utility's requirements. Approvals themselves remain with the authority.",
      },
      {
        q: "Can you extend an existing network?",
        a: "Yes. We survey the existing network, check its spare capacity and protection arrangements, and design the extension so that it integrates safely.",
      },
      {
        q: "Do you supply the transformers and switchgear?",
        a: "We can specify and procure them as part of the project, or install client-supplied equipment. See our Electrical Equipment Procurement service for detail.",
      },
    ],
  },
  {
    slug: "solar-energy-systems",
    title: "Solar Energy Systems",
    icon: "sun",
    summary:
      "Solar PV, hybrid and battery storage systems engineered around your load profile and site conditions.",
    overview: [
      "A solar system performs well when it is sized to the load it serves. We begin with consumption data and site conditions, then select the array, inverter and storage arrangement that meet the objective, whether that is reducing grid dependence, providing backup, or both.",
      "We design and install grid-tied, hybrid and off-grid systems for commercial, industrial, agricultural and residential clients, with proper DC and AC protection, earthing and commissioning.",
    ],
    scope: [
      "Load profiling and energy needs assessment",
      "System sizing: array, inverter and battery storage",
      "Roof-mounted and ground-mounted PV array installation",
      "Hybrid inverter and battery energy storage systems",
      "DC and AC protection, isolation, surge protection and earthing",
      "Integration with existing distribution boards and standby generators",
      "System commissioning, performance verification and user handover",
    ],
    applications: [
      "Commercial buildings and offices",
      "Factories and cold-storage facilities",
      "Farms, irrigation pumping and agro-processing",
      "Schools, clinics and lodges",
      "Homes and residential developments",
    ],
    process: [
      {
        title: "Energy assessment",
        text: "We review consumption, critical loads and site constraints such as roof area, shading and orientation.",
      },
      {
        title: "System design",
        text: "Array, inverter, storage and protection are sized and documented, with an equipment schedule.",
      },
      {
        title: "Supply and installation",
        text: "Equipment is supplied and installed with attention to structural fixing, cable routing and protection.",
      },
      {
        title: "Commissioning",
        text: "DC and AC tests are completed and the system is verified before handover.",
      },
      {
        title: "Handover and support",
        text: "Operating guidance, documentation and a maintenance recommendation are provided.",
      },
    ],
    related: [
      "electrical-installations",
      "electrical-testing-and-commissioning",
      "electrical-equipment-procurement",
    ],
    faqs: [
      {
        q: "Do I need batteries?",
        a: "Not always. Batteries add resilience and allow solar energy to be used after sunset, but they add cost. We size the system against your objective, and will recommend a grid-tied or hybrid arrangement based on what you need.",
      },
      {
        q: "Can solar connect to my existing generator?",
        a: "Yes, with a suitable control arrangement. Solar and generator integration must be designed carefully so that the generator is not back-fed and loads are managed correctly.",
      },
      {
        q: "How large a system do I need?",
        a: "That depends on your consumption, peak demand, available area and budget. Send us recent electricity bills or a description of your equipment and we will outline an appropriate system.",
      },
      {
        q: "What maintenance does a solar system need?",
        a: "Panels need periodic cleaning and inspection, and electrical connections, protection devices and batteries should be checked on a schedule. We can include a maintenance plan with the installation.",
      },
    ],
  },
  {
    slug: "industrial-electrical-maintenance",
    title: "Industrial Electrical Maintenance",
    icon: "wrench",
    summary:
      "Planned and reactive maintenance that keeps motors, switchgear and distribution systems running and safe.",
    overview: [
      "In an industrial plant, unplanned electrical failure stops production. Planned maintenance replaces surprises with scheduled inspection, testing and repair, and gives you records you can use to prioritise spending.",
      "We provide planned maintenance programmes and fault-finding support for industrial electrical systems, from main switchgear and motor control centres to motors, drives and lighting.",
    ],
    scope: [
      "Planned inspection and maintenance of switchboards, MCCs and distribution boards",
      "Thermographic inspection of connections and equipment, where equipment is available for the site",
      "Motor, starter and drive inspection, testing and repair coordination",
      "Protection relay and circuit breaker checks",
      "Fault finding and corrective repairs",
      "Earthing system and lightning protection inspection",
      "Condition reports with prioritised recommendations",
    ],
    applications: [
      "Mines and mineral processing plants",
      "Manufacturing and food processing",
      "Agricultural processing and packhouses",
      "Water pumping and treatment stations",
      "Large commercial and institutional facilities",
    ],
    process: [
      {
        title: "Site survey",
        text: "We record the installed equipment, its condition and its criticality to your operation.",
      },
      {
        title: "Maintenance plan",
        text: "Inspection tasks and intervals are agreed around production and shutdown windows.",
      },
      {
        title: "Inspection and testing",
        text: "Work is carried out safely under agreed isolation and permit arrangements.",
      },
      {
        title: "Repair and correction",
        text: "Defects are corrected or recommended for action in priority order.",
      },
      {
        title: "Reporting",
        text: "Findings, actions and recommendations are recorded in a report.",
      },
    ],
    related: [
      "electrical-testing-and-commissioning",
      "power-distribution-infrastructure",
      "electrical-equipment-procurement",
    ],
    faqs: [
      {
        q: "Do you offer breakdown call-outs?",
        a: "Contact us with the details of the fault and your location and we will confirm what response we can provide. For ongoing cover we recommend agreeing a maintenance arrangement in advance.",
      },
      {
        q: "Can maintenance be done without shutting down production?",
        a: "Some inspection, such as thermal imaging and visual checks, can be done on live equipment under suitable safety conditions. Other work needs isolation, and we plan it for shutdown windows.",
      },
      {
        q: "Do you work on equipment you did not install?",
        a: "Yes. We begin with a condition survey so that we understand what is installed and its state before proposing a maintenance plan.",
      },
    ],
  },
  {
    slug: "electrical-testing-and-commissioning",
    title: "Electrical Testing and Commissioning",
    icon: "gauge",
    summary:
      "Inspection, testing and commissioning that verifies installations are safe and perform as designed before they are energised.",
    overview: [
      "Testing is the evidence that an installation is safe and correct. Before any new or altered system is energised, it should be inspected and tested against the design and the applicable standard, and the results recorded.",
      "We carry out pre-energisation inspection and testing, functional commissioning and performance verification on electrical installations, distribution equipment and solar systems, and issue the records that support handover.",
    ],
    scope: [
      "Visual inspection against the design and specification",
      "Continuity of protective conductors and bonding",
      "Insulation resistance testing",
      "Earth electrode and earth fault loop impedance measurement",
      "Protective device and residual current device testing",
      "Phase sequence, polarity and functional checks",
      "Solar PV string and system verification",
      "Commissioning records and test certificates",
    ],
    applications: [
      "Newly completed installations before energisation",
      "Alterations and extensions to existing systems",
      "Periodic inspection of existing installations",
      "Solar PV and battery systems prior to handover",
      "Verification of switchgear and transformer installations",
    ],
    process: [
      {
        title: "Test planning",
        text: "We review the design, identify the tests required and agree the sequence with the project team.",
      },
      {
        title: "Inspection",
        text: "Installed equipment is inspected against the specification before testing begins.",
      },
      {
        title: "Dead tests",
        text: "Continuity and insulation resistance are measured before the supply is connected.",
      },
      {
        title: "Live tests and commissioning",
        text: "The system is energised in a controlled sequence and functional and protection checks are made.",
      },
      {
        title: "Records",
        text: "Results are documented and any defects are reported for correction and re-test.",
      },
    ],
    related: [
      "electrical-installations",
      "solar-energy-systems",
      "industrial-electrical-maintenance",
    ],
    faqs: [
      {
        q: "Can you test an installation someone else completed?",
        a: "Yes. Independent inspection and testing is a common request. We report what we find, including defects that need correction.",
      },
      {
        q: "What records will I receive?",
        a: "You receive documented test results for the circuits and equipment tested, together with a list of any defects and recommended actions.",
      },
      {
        q: "How often should an installation be re-tested?",
        a: "Intervals depend on the type of installation, its use and its environment. We can recommend an interval for your premises.",
      },
    ],
  },
  {
    slug: "electrical-equipment-procurement",
    title: "Electrical Equipment Procurement",
    icon: "package",
    summary:
      "Specification and sourcing of switchgear, cables, transformers, solar equipment and other electrical plant for your project.",
    overview: [
      "The right equipment, specified correctly, avoids redesign and delay. Procurement support starts with a clear technical specification: ratings, fault levels, enclosure protection, standards and delivery requirements.",
      "We help clients specify and source electrical equipment for projects we deliver and for projects delivered by others, with attention to compatibility, lead time and the availability of spares and support.",
    ],
    scope: [
      "Preparation of technical equipment specifications",
      "Sourcing and comparison of supplier quotations",
      "Switchgear, distribution boards, cables, cable management and protection devices",
      "Transformers, generators and power factor correction equipment",
      "Solar modules, inverters, batteries and mounting systems",
      "Technical review of supplier submittals against the specification",
      "Delivery coordination and receiving inspection",
    ],
    applications: [
      "Projects delivered by Zentrik Solutions",
      "Contractors who need specification or sourcing support",
      "Facility owners replacing or expanding equipment",
      "Developers procuring electrical packages",
    ],
    process: [
      {
        title: "Requirements",
        text: "We confirm the electrical requirements, standards and site conditions.",
      },
      {
        title: "Specification",
        text: "A technical specification and equipment schedule are prepared.",
      },
      {
        title: "Sourcing",
        text: "Quotations are obtained and compared on a technical and commercial basis.",
      },
      {
        title: "Review",
        text: "Supplier data is checked against the specification before an order is placed.",
      },
      {
        title: "Delivery",
        text: "Delivery is coordinated and equipment is inspected on receipt.",
      },
    ],
    related: [
      "power-distribution-infrastructure",
      "solar-energy-systems",
      "electrical-installations",
    ],
    faqs: [
      {
        q: "Can I buy equipment from you without an installation?",
        a: "Tell us what you need through the enquiry form and we will confirm whether we can source it for you.",
      },
      {
        q: "Do you work with client-preferred brands?",
        a: "Yes. If you have a preferred manufacturer we will specify around it, and advise if it conflicts with the technical requirements.",
      },
      {
        q: "Do you check that equipment is suitable?",
        a: "Yes. We compare ratings, fault levels, enclosure protection and standards compliance before recommending a purchase.",
      },
    ],
  },
];

/** Illustrative photography only; not images of Zentrik Solutions projects. */
const SERVICE_IMAGES: Record<string, ServiceImage> = {
  "electrical-installations": {
    src: "/images/electrician-installation.jpg",
    alt: "Electrician in a hard hat and gloves working on an isolator and wiring",
    width: 1800,
    height: 1202,
  },
  "power-distribution-infrastructure": {
    src: "/images/distribution-substation.jpg",
    alt: "Electrical substation with insulators, busbars and overhead conductors against a blue sky",
    width: 1800,
    height: 1200,
  },
  "solar-energy-systems": {
    src: "/images/solar-array.jpg",
    alt: "Rows of ground-mounted solar PV panels in a field",
    width: 1800,
    height: 1198,
  },
  "industrial-electrical-maintenance": {
    src: "/images/maintenance-testing-gloves.jpg",
    alt: "Gloved technician measuring voltage with a multimeter inside an industrial electrical enclosure",
    width: 1800,
    height: 949,
  },
  "electrical-testing-and-commissioning": {
    src: "/images/testing-probes.jpg",
    alt: "Gloved hands testing contactor terminals with multimeter probes",
    width: 1800,
    height: 1350,
  },
  "electrical-equipment-procurement": {
    src: "/images/control-panel.jpg",
    alt: "Neatly wired control panel with PLC modules, power supplies and labelled terminals",
    width: 1800,
    height: 1200,
  },
};

export const SERVICES: Service[] = BASE_SERVICES.map((s) => ({
  ...s,
  image: SERVICE_IMAGES[s.slug],
}));

export function getService(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
