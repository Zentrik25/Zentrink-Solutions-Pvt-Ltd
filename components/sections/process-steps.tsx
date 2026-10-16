export type Step = { title: string; text: string };

export function ProcessSteps({
  steps,
  tone = "light",
}: {
  steps: Step[];
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <ol
      className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:[grid-template-columns:repeat(var(--steps),minmax(0,1fr))]"
      style={{ ["--steps" as string]: steps.length }}
    >
      {steps.map((step, i) => (
        <li key={step.title} className={`border-t-4 pt-6 ${dark ? "border-accent" : "border-navy-900"}`}>
          <span className="font-display text-4xl font-black text-accent">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className={`mt-4 text-lg font-extrabold uppercase ${dark ? "text-white" : "text-navy-900"}`}>
            {step.title}
          </h3>
          <p className={`mt-3 leading-relaxed ${dark ? "text-steel-300" : "text-steel-600"}`}>
            {step.text}
          </p>
        </li>
      ))}
    </ol>
  );
}

export const DELIVERY_PROCESS: Step[] = [
  {
    title: "Enquiry and brief",
    text: "You describe the project, its location and objectives. We confirm the information required to proceed.",
  },
  {
    title: "Site assessment",
    text: "We assess the site, existing installation and constraints, and where necessary visit in person.",
  },
  {
    title: "Design and proposal",
    text: "We prepare a scope, specification and quotation that you can review and compare.",
  },
  {
    title: "Installation",
    text: "Work is carried out and supervised against the approved design with safe working practices.",
  },
  {
    title: "Testing and handover",
    text: "Systems are tested and commissioned, and documentation is handed over before project close.",
  },
];
