import type { EnquiryStatus } from "@/generated/prisma/enums";

export const STATUS_ORDER: EnquiryStatus[] = [
  "NEW",
  "UNDER_REVIEW",
  "CONTACTED",
  "SITE_VISIT_SCHEDULED",
  "QUOTATION_PREPARED",
  "QUOTATION_SENT",
  "WON",
  "LOST",
  "CLOSED",
];

export const STATUS_LABEL: Record<EnquiryStatus, string> = {
  NEW: "New",
  UNDER_REVIEW: "Under Review",
  CONTACTED: "Contacted",
  SITE_VISIT_SCHEDULED: "Site Visit Scheduled",
  QUOTATION_PREPARED: "Quotation Prepared",
  QUOTATION_SENT: "Quotation Sent",
  WON: "Won",
  LOST: "Lost",
  CLOSED: "Closed",
};

const TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
  NEW: ["UNDER_REVIEW", "CONTACTED", "LOST", "CLOSED"],
  UNDER_REVIEW: ["CONTACTED", "SITE_VISIT_SCHEDULED", "QUOTATION_PREPARED", "LOST", "CLOSED"],
  CONTACTED: ["UNDER_REVIEW", "SITE_VISIT_SCHEDULED", "QUOTATION_PREPARED", "LOST", "CLOSED"],
  SITE_VISIT_SCHEDULED: ["CONTACTED", "QUOTATION_PREPARED", "LOST", "CLOSED"],
  QUOTATION_PREPARED: ["SITE_VISIT_SCHEDULED", "QUOTATION_SENT", "LOST", "CLOSED"],
  QUOTATION_SENT: ["QUOTATION_PREPARED", "WON", "LOST", "CLOSED"],
  WON: ["CLOSED"],
  LOST: ["UNDER_REVIEW", "CLOSED"],
  CLOSED: ["UNDER_REVIEW"],
};

export function allowedTransitions(from: EnquiryStatus): EnquiryStatus[] {
  return TRANSITIONS[from];
}

export function canTransition(from: EnquiryStatus, to: EnquiryStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function formatEnquiryReference(seq: number, date = new Date()): string {
  return `ZS-ENQ-${date.getUTCFullYear()}-${String(seq).padStart(5, "0")}`;
}
