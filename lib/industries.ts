export type Industry = {
  slug: string;
  title: string;
  summary: string;
  needs: string[];
  services: string[];
};

export const INDUSTRIES: Industry[] = [
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
      "power-distribution-infrastructure",
      "industrial-electrical-maintenance",
      "solar-energy-systems",
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
      "industrial-electrical-maintenance",
      "electrical-testing-and-commissioning",
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
      "solar-energy-systems",
      "power-distribution-infrastructure",
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
      "electrical-testing-and-commissioning",
      "electrical-equipment-procurement",
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
      "solar-energy-systems",
      "electrical-testing-and-commissioning",
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
      "solar-energy-systems",
      "power-distribution-infrastructure",
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
      "power-distribution-infrastructure",
      "industrial-electrical-maintenance",
      "solar-energy-systems",
    ],
  },
];
