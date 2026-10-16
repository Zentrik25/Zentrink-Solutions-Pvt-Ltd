import { SERVICES } from "@/lib/services";

export const SERVICE_OPTIONS = [
  ...SERVICES.map((s) => ({ value: s.slug, label: s.title })),
  { value: "multiple", label: "Multiple services / not sure yet" },
] as const;

export const ENQUIRY_FIELDS = [
  "name",
  "company",
  "email",
  "phone",
  "service",
  "location",
  "description",
  "consent",
] as const;

export type EnquiryField = (typeof ENQUIRY_FIELDS)[number];
export type EnquiryValues = Record<EnquiryField, string>;
export type EnquiryErrors = Partial<Record<EnquiryField, string>>;

export type EnquiryState =
  | { status: "idle"; values: EnquiryValues; errors: EnquiryErrors }
  | { status: "invalid"; values: EnquiryValues; errors: EnquiryErrors }
  | {
      /** Valid enquiry, but no delivery backend is connected yet (Phase 2). Nothing was sent. */
      status: "unavailable";
      values: EnquiryValues;
      errors: EnquiryErrors;
      whatsappMessage: string;
    };

export function emptyValues(service = ""): EnquiryValues {
  return {
    name: "",
    company: "",
    email: "",
    phone: "",
    service,
    location: "",
    description: "",
    consent: "",
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9\s()-]{6,19}$/;

export function validateEnquiry(values: EnquiryValues): EnquiryErrors {
  const errors: EnquiryErrors = {};

  if (values.name.length < 2 || values.name.length > 100)
    errors.name = "Enter your full name (2 to 100 characters).";

  if (values.company.length > 120) errors.company = "Company name is too long.";

  if (!EMAIL_RE.test(values.email) || values.email.length > 160)
    errors.email = "Enter a valid email address.";

  if (values.phone && !PHONE_RE.test(values.phone))
    errors.phone = "Enter a valid phone number, for example +263 77 123 4567.";

  if (!SERVICE_OPTIONS.some((o) => o.value === values.service))
    errors.service = "Select the service you are enquiring about.";

  if (values.location.length < 2 || values.location.length > 160)
    errors.location = "Enter the project location (town, suburb or site).";

  if (values.description.length < 20)
    errors.description = "Describe the project in at least 20 characters.";
  else if (values.description.length > 3000)
    errors.description = "Description must be 3000 characters or fewer.";

  if (values.consent !== "yes")
    errors.consent = "Please confirm that we may contact you about this enquiry.";

  return errors;
}

export function enquiryToText(v: EnquiryValues): string {
  const service = SERVICE_OPTIONS.find((o) => o.value === v.service)?.label ?? v.service;
  return [
    "Project enquiry for Zentrik Solutions",
    `Name: ${v.name}`,
    v.company && `Company: ${v.company}`,
    `Email: ${v.email}`,
    v.phone && `Phone: ${v.phone}`,
    `Service: ${service}`,
    `Location: ${v.location}`,
    `Description: ${v.description}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export type DeliveryResult = { ok: true } | { ok: false; reason: "not_configured" };

/**
 * PHASE 2 INTEGRATION POINT.
 * Replace this body with the real backend call (persist the enquiry, notify
 * the team). Until a backend exists it reports "not_configured" so the UI
 * never claims a submission succeeded when nothing was sent.
 */
export async function deliverEnquiry(values: EnquiryValues): Promise<DeliveryResult> {
  void values;
  return { ok: false, reason: "not_configured" };
}
