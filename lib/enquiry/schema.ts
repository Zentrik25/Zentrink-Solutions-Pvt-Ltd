import { z } from "zod";
import { BUDGET_OPTIONS } from "./constants";

const text = (min: number, max: number, msg: string) =>
  z
    .string()
    .trim()
    .min(min, msg)
    .max(max, `Must be ${max} characters or fewer.`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer.`)
    .transform((v) => (v === "" ? undefined : v))
    .optional();

export const enquirySchema = z.object({
  name: text(2, 100, "Enter your full name."),
  company: optionalText(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(160)
    .pipe(z.email("Enter a valid email address.")),
  phone: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(
      z
        .string()
        .regex(/^\+?[0-9][0-9\s()-]{6,19}$/, "Enter a valid phone number, for example +263 77 123 4567.")
        .optional(),
    )
    .optional(),
  service: text(1, 80, "Select the service you need."),
  location: text(2, 160, "Enter the project location."),
  description: text(20, 3000, "Describe the project in at least 20 characters."),
  budget: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(
      z
        .enum(BUDGET_OPTIONS.map((b) => b.value) as [string, ...string[]], {
          error: "Select a budget range from the list.",
        })
        .optional(),
    )
    .optional(),
  preferredStart: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")
        .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "Enter a valid date.")
        .refine(
          (v) => Date.parse(`${v}T00:00:00Z`) >= Date.now() - 2 * 86400_000,
          "The start date cannot be in the past.",
        )
        .refine(
          (v) => Date.parse(`${v}T00:00:00Z`) <= Date.now() + 5 * 365 * 86400_000,
          "Enter a start date within the next five years.",
        )
        .optional(),
    )
    .optional(),
  consent: z.literal("yes", { error: "Please confirm that we may contact you about this enquiry." }),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
export type EnquiryFieldName = keyof EnquiryInput | "documents";
export type EnquiryFieldErrors = Partial<Record<EnquiryFieldName, string>>;

export const ENQUIRY_FIELD_NAMES = [
  "name",
  "company",
  "email",
  "phone",
  "service",
  "location",
  "description",
  "budget",
  "preferredStart",
  "consent",
] as const;

export function fieldErrors(error: z.ZodError): EnquiryFieldErrors {
  const out: EnquiryFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as EnquiryFieldName | undefined;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/** Result returned to the browser by the enquiry Server Action. */
export type EnquiryActionState =
  | { status: "idle"; values: Record<string, string>; errors: EnquiryFieldErrors }
  | { status: "invalid"; values: Record<string, string>; errors: EnquiryFieldErrors }
  | { status: "error"; values: Record<string, string>; errors: EnquiryFieldErrors; message: string }
  | { status: "success"; reference: string; values: Record<string, string>; errors: EnquiryFieldErrors };
