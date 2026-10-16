"use server";

import {
  ENQUIRY_FIELDS,
  deliverEnquiry,
  emptyValues,
  enquiryToText,
  validateEnquiry,
  type EnquiryState,
  type EnquiryValues,
} from "@/lib/enquiry";

function clean(value: FormDataEntryValue | null, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function submitEnquiry(
  _prev: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const values: EnquiryValues = emptyValues();
  for (const field of ENQUIRY_FIELDS) {
    values[field] = clean(formData.get(field), field === "description" ? 3500 : 200);
  }

  // Honeypot: real visitors never see or fill this field.
  if (clean(formData.get("website"), 50)) {
    return { status: "invalid", values: emptyValues(), errors: {} };
  }

  const errors = validateEnquiry(values);
  if (Object.keys(errors).length > 0) {
    return { status: "invalid", values, errors };
  }

  const result = await deliverEnquiry(values);
  if (result.ok) {
    // Reached only once Phase 2 wires a real backend into deliverEnquiry().
    return { status: "idle", values: emptyValues(), errors: {} };
  }

  return {
    status: "unavailable",
    values,
    errors: {},
    whatsappMessage: enquiryToText(values),
  };
}
