import { cn } from "@/lib/cn";

export type Step = { title: string; text: string };

export function ProcessSteps({ steps, tone = "light" }: { steps: Step[]; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <ol
      className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:[grid-template-columns:repeat(var(--steps),minmax(0,1fr))]"
      style={{ ["--steps" as string]: steps.length }}
    >
      {steps.map((step, i) => (
        <li key={step.title} className="relative">
          {/* Timeline rail with a node per step */}
          <div className="mb-5 flex items-center gap-3">
            <span
              className={cn(
                "t-label tnum flex size-8 items-center justify-center rounded-md border",
                dark ? "border-white/20 bg-white/[0.06] text-amber" : "border-steel-200 bg-white text-accent-strong shadow-ambient",
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span aria-hidden className={cn("hidden h-px flex-1 lg:block", dark ? "bg-white/15" : "bg-steel-200", i === steps.length - 1 && "lg:hidden")} />
          </div>
          <h3 className={cn("t-h4", dark ? "!text-white" : "text-navy-950")}>{step.title}</h3>
          <p className={cn("mt-2 text-[0.9375rem] leading-relaxed", dark ? "text-white/65" : "text-steel-500")}>{step.text}</p>
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
