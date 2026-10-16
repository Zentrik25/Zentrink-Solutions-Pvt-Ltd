export const BUDGET_OPTIONS = [
  { value: "under-5k", label: "Under US$5,000" },
  { value: "5k-20k", label: "US$5,000 to US$20,000" },
  { value: "20k-50k", label: "US$20,000 to US$50,000" },
  { value: "50k-100k", label: "US$50,000 to US$100,000" },
  { value: "over-100k", label: "Over US$100,000" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

export const MULTIPLE_SERVICES = "multiple";

export type ServiceOption = { value: string; label: string };

export const CONSENT_TEXT_VERSION = "2026-10";

export function budgetLabel(value: string | null | undefined): string | null {
  return BUDGET_OPTIONS.find((b) => b.value === value)?.label ?? null;
}
