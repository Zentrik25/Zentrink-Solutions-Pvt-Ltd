/** Seed categories; live categories come from the database. */
export const ARTICLE_CATEGORIES = [
  "Solar Energy",
  "Power Systems",
  "Testing and Safety",
  "Maintenance",
  "Procurement",
] as const;

export type ArticleCategory = string;

export type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

export type Article = {
  seo?: { title?: string; description?: string };
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  published: string;
  body: Block[];
};

export const ARTICLES: Article[] = [
  {
    slug: "sizing-a-solar-pv-system-for-a-commercial-load",
    title: "Sizing a Solar PV System for a Commercial Load",
    excerpt:
      "A solar system performs well when it is matched to the load it serves. These are the inputs that determine array, inverter and storage size.",
    category: "Solar Energy",
    published: "2026-10-12",
    body: [
      {
        type: "p",
        text: "Undersized systems disappoint and oversized systems waste capital. Sizing a commercial solar PV system starts with understanding the load, not with the number of panels that fit on a roof.",
      },
      { type: "h2", text: "Start with the load profile" },
      {
        type: "p",
        text: "Daily and monthly energy consumption in kilowatt-hours, and the time of day that energy is used, tell you how much of the load solar can serve directly. A business that operates mainly in daylight can use most of its solar output as it is generated. A business with a night-time load needs storage to benefit.",
      },
      { type: "h2", text: "Inputs that determine system size" },
      {
        type: "ul",
        items: [
          "Monthly and daily energy consumption, taken from bills or metering",
          "Peak demand and the loads that cause it, such as motors and air conditioning",
          "Available roof or ground area, orientation, tilt and shading",
          "Whether the objective is to reduce utility consumption, provide backup, or both",
          "The condition and capacity of the existing distribution board and supply",
        ],
      },
      { type: "h2", text: "Array, inverter and storage" },
      {
        type: "p",
        text: "The array rating, in kilowatts-peak, is set by the energy you want to produce and the area available. The inverter must be matched to the array and to the loads it serves, including starting currents. Battery storage is sized to the energy you need to shift or to the critical loads you must keep running, and to the depth of discharge that the battery chemistry allows.",
      },
      { type: "h2", text: "Integration with the existing installation" },
      {
        type: "p",
        text: "A solar system connects to an existing installation, so the condition of that installation matters. Cable ratings, busbar capacity, protection and earthing must be checked before connection. Where a standby generator is present, the control arrangement must prevent back-feed and manage how the sources share the load.",
      },
    ],
  },
  {
    slug: "cable-sizing-fundamentals-current-voltage-drop-fault-withstand",
    title: "Cable Sizing Fundamentals: Current, Voltage Drop and Fault Withstand",
    excerpt:
      "A cable must satisfy three separate checks. Passing only one of them is a common cause of overheating, poor performance and failed protection.",
    category: "Power Systems",
    published: "2026-10-05",
    body: [
      {
        type: "p",
        text: "Selecting a cable size is not a single calculation. A cable must carry its load without overheating, deliver acceptable voltage at the far end, and survive a fault until the protective device clears it.",
      },
      { type: "h2", text: "1. Current-carrying capacity" },
      {
        type: "p",
        text: "The cable rating depends on the conductor material and insulation, and on how the cable is installed. Installation method, ambient temperature, grouping with other circuits and thermal insulation all reduce the current a cable can carry, and derating factors must be applied.",
      },
      { type: "h2", text: "2. Voltage drop" },
      {
        type: "p",
        text: "Long cables lose voltage under load. Excessive voltage drop reduces motor torque, shortens equipment life and can prevent equipment starting. A cable that is thermally adequate may still need to be increased in size to keep voltage drop within the limits in the applicable standard.",
      },
      { type: "h2", text: "3. Fault withstand and protection" },
      {
        type: "p",
        text: "During a short circuit, a cable heats rapidly. The protective device must clear the fault before the conductor or insulation is damaged, and, for final circuits, fast enough to limit touch voltage. This depends on the prospective fault current and the characteristics of the protective device, which is why cable size and protection must be selected together.",
      },
      { type: "h2", text: "Putting it together" },
      {
        type: "p",
        text: "The governing cable size is the largest of the three results. Document the assumptions: load, length, installation method, ambient conditions and protective device, so that the design can be checked and modified later.",
      },
    ],
  },
  {
    slug: "why-pre-energisation-testing-matters",
    title: "Why Pre-Energisation Testing Matters",
    excerpt:
      "Inspection and testing before a system is energised is the evidence that it is safe. These are the core tests and what each one confirms.",
    category: "Testing and Safety",
    published: "2026-09-29",
    body: [
      {
        type: "p",
        text: "A new or altered installation can look complete and still hide faults: a loose termination, a reversed polarity, a damaged cable or a missing bond. Inspection and testing before energisation finds these faults while they can be corrected safely.",
      },
      { type: "h2", text: "Core tests" },
      {
        type: "ul",
        items: [
          "Continuity of protective conductors confirms that earthing and bonding paths are intact.",
          "Insulation resistance confirms that conductors are properly isolated from each other and from earth.",
          "Polarity confirms that line, neutral and earth are connected correctly.",
          "Earth fault loop impedance confirms that a fault will draw enough current for the protective device to operate in time.",
          "Residual current device testing confirms that RCDs trip within their required limits.",
        ],
      },
      { type: "h2", text: "Dead tests before live tests" },
      {
        type: "p",
        text: "Tests that can be carried out with the supply disconnected are done first. Only when these results are satisfactory is the installation energised for live tests, such as earth fault loop impedance and functional checks. This sequence protects people and equipment.",
      },
      { type: "h2", text: "Why records matter" },
      {
        type: "p",
        text: "Test results form a baseline. They show that the installation met the specification at handover, and they give maintenance teams something to compare against when diagnosing a problem later. Verification practice for low-voltage installations is described in the IEC 60364 series.",
      },
    ],
  },
  {
    slug: "planned-versus-reactive-electrical-maintenance",
    title: "Planned Versus Reactive Electrical Maintenance in Industrial Plants",
    excerpt:
      "Waiting for equipment to fail is an expensive maintenance strategy. A planned approach finds problems while they are still inexpensive to fix.",
    category: "Maintenance",
    published: "2026-09-22",
    body: [
      {
        type: "p",
        text: "Reactive maintenance responds after something has failed. It is sometimes unavoidable, but when it is the only strategy, failures happen at the worst times, repairs are rushed and the cost of downtime is added to the cost of repair.",
      },
      { type: "h2", text: "What planned maintenance involves" },
      {
        type: "ul",
        items: [
          "Visual inspection of switchgear, boards, cabling and enclosures",
          "Tightening and inspection of connections, which loosen with thermal cycling and vibration",
          "Thermal imaging to find hot connections before they fail",
          "Testing of protection devices and earthing",
          "Cleaning, and checking of enclosure sealing against dust and moisture",
        ],
      },
      { type: "h2", text: "Prioritise by criticality" },
      {
        type: "p",
        text: "Not all equipment matters equally. Rank equipment by what its failure would cost in lost production, safety risk and repair time, and give the most critical assets the closest attention.",
      },
      { type: "h2", text: "Records turn maintenance into information" },
      {
        type: "p",
        text: "Each inspection should leave a record of what was found and what was done. Over time those records reveal recurring faults, ageing equipment and the spending that will be required, which allows maintenance budgets to be planned rather than guessed.",
      },
    ],
  },
  {
    slug: "procurement-checklist-for-distribution-boards-and-switchgear",
    title: "Procurement Checklist for Distribution Boards and Switchgear",
    excerpt:
      "Most switchgear problems on site trace back to an incomplete specification. These are the points to settle before you request quotations.",
    category: "Procurement",
    published: "2026-09-15",
    body: [
      {
        type: "p",
        text: "Two quotations for a main switchboard can differ widely in price because they describe different equipment. A complete specification makes quotations comparable and prevents costly changes after delivery.",
      },
      { type: "h2", text: "Electrical ratings" },
      {
        type: "ul",
        items: [
          "Rated operational voltage and system earthing arrangement",
          "Incomer and busbar current rating",
          "Prospective short-circuit current at the board, and the short-circuit withstand rating the equipment needs",
          "Breaking capacity of protective devices",
        ],
      },
      { type: "h2", text: "Construction and standards" },
      {
        type: "ul",
        items: [
          "Compliance with the IEC 61439 series for low-voltage switchgear assemblies, with manufacturer design verification",
          "Enclosure protection (IP) rating appropriate to the environment",
          "Form of internal separation required",
          "Provision for future expansion, such as spare ways and busbar space",
          "Cable entry position and termination space",
        ],
      },
      { type: "h2", text: "Supplier and support" },
      {
        type: "p",
        text: "Check lead time, warranty terms and the availability of spares and technical support in Zimbabwe. Request the data sheets and drawings for review before placing an order, and agree the inspection and test requirements on delivery.",
      },
    ],
  },
  {
    slug: "power-factor-correction-and-when-it-pays-back",
    title: "Power Factor Correction: What It Is and When It Pays Back",
    excerpt:
      "Low power factor increases current without increasing useful work. Correcting it can reduce losses and, where the tariff penalises it, charges.",
    category: "Power Systems",
    published: "2026-09-08",
    body: [
      {
        type: "p",
        text: "Motors, transformers and other inductive loads draw reactive power as well as real power. Reactive power does no useful work, but it adds to the current that cables, transformers and switchgear must carry.",
      },
      { type: "h2", text: "What power factor measures" },
      {
        type: "p",
        text: "Power factor is the ratio of real power, in kilowatts, to apparent power, in kilovolt-amperes. A power factor close to 1 means current is being used efficiently. A low power factor means more current is needed for the same useful power.",
      },
      { type: "h2", text: "Why it matters" },
      {
        type: "ul",
        items: [
          "Higher current increases losses in cables and transformers.",
          "Capacity is consumed that could serve additional load.",
          "Some utility tariffs charge for low power factor or for reactive demand, so check your tariff structure.",
        ],
      },
      { type: "h2", text: "How it is corrected" },
      {
        type: "p",
        text: "Capacitor banks supply reactive power locally, reducing the demand on the network. Banks may be fixed or automatic, switching steps in and out as load changes. In sites with harmonic-producing equipment such as variable speed drives, detuned reactors are usually required to protect the capacitors.",
      },
      { type: "h2", text: "Does it pay back?" },
      {
        type: "p",
        text: "That depends on your load, your tariff and the existing power factor. Review several months of billing data and measure at the main incomer before investing. If your tariff does not penalise low power factor, the benefit may be limited to reduced losses and released capacity.",
      },
    ],
  },
  {
    slug: "hybrid-solar-design-for-supply-interruptions",
    title: "Hybrid Solar Design for Supply Interruptions",
    excerpt:
      "A grid-tied solar system normally shuts down when the grid fails. A hybrid system can keep critical loads running if it is designed for it.",
    category: "Solar Energy",
    published: "2026-09-01",
    body: [
      {
        type: "p",
        text: "Many solar installations are grid-tied. For safety, a standard grid-tied inverter disconnects when the grid supply fails, so the array produces nothing during an outage. A hybrid system adds battery storage and an inverter that can form its own supply.",
      },
      { type: "h2", text: "Separate critical loads" },
      {
        type: "p",
        text: "Backing up an entire building is rarely economical. The usual approach is to move essential circuits, such as lighting, refrigeration, communications and selected power points, to a separate critical-loads board fed from the inverter. Large motors and heating loads are typically left off it.",
      },
      { type: "h2", text: "Design considerations" },
      {
        type: "ul",
        items: [
          "Define the critical loads and the hours of autonomy required",
          "Size the battery for usable energy, not nameplate capacity",
          "Size the inverter for peak and starting loads of the critical circuits",
          "Provide correct changeover and isolation so that the system cannot back-feed the grid",
          "Plan how a generator, if present, will interface with the system",
        ],
      },
      { type: "h2", text: "Protection and commissioning" },
      {
        type: "p",
        text: "Battery systems store large amounts of energy and need properly rated DC protection, isolation and ventilation as specified by the manufacturer. Commissioning should include testing of the changeover behaviour, which verifies that critical loads transfer as designed. PV commissioning practice is covered by the IEC 62446-1 standard.",
      },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function readingMinutes(article: Article): number {
  const words = article.body
    .map((b) => (b.type === "ul" ? b.items.join(" ") : b.text))
    .join(" ")
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
