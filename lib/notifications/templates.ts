import { budgetLabel } from "@/lib/enquiry/constants";

export function esc(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif;color:#1f242b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;width:100%">
<tr><td style="background:#0b1f3a;color:#ffffff;padding:20px 28px;border-bottom:4px solid #f26a1b;font-size:18px;font-weight:bold;letter-spacing:1px">ZENTRIK SOLUTIONS (PVT) LTD</td></tr>
<tr><td style="padding:28px"><h1 style="margin:0 0 16px;font-size:20px;color:#0b1f3a">${esc(title)}</h1>${bodyHtml}</td></tr>
<tr><td style="padding:16px 28px;background:#f0f2f5;font-size:12px;color:#4f5b69">Zentrik Solutions (Pvt) Ltd &middot; Electrical Engineering &middot; Zimbabwe</td></tr>
</table></td></tr></table></body></html>`;
}

function rows(pairs: [string, string | null | undefined][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #c9d0d8;margin:12px 0">${pairs
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e1e5ea;width:150px;color:#4f5b69;font-size:13px;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;border-bottom:1px solid #e1e5ea;font-size:14px;white-space:pre-wrap">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

export type EnquiryEmailData = {
  reference: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  serviceLabel: string;
  location: string;
  description: string;
  budgetRange: string | null;
  preferredStart: Date | null;
  attachmentCount: number;
};

export function companyEnquiryEmail(e: EnquiryEmailData, adminUrl: string) {
  const start = e.preferredStart ? e.preferredStart.toISOString().slice(0, 10) : null;
  const pairs: [string, string | null][] = [
    ["Reference", e.reference],
    ["Name", e.name],
    ["Company", e.company],
    ["Email", e.email],
    ["Phone", e.phone],
    ["Service", e.serviceLabel],
    ["Location", e.location],
    ["Budget", budgetLabel(e.budgetRange)],
    ["Preferred start", start],
    ["Attachments", e.attachmentCount ? `${e.attachmentCount} file(s), see dashboard` : null],
    ["Description", e.description],
  ];
  return {
    subject: `New project enquiry ${e.reference}: ${e.serviceLabel}`,
    html: layout(
      "New project enquiry",
      `${rows(pairs)}<p><a href="${esc(adminUrl)}" style="color:#c2410c;font-weight:bold">Open in dashboard</a></p>`,
    ),
    text: `New project enquiry ${e.reference}\n\n${pairs
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n")}\n\nDashboard: ${adminUrl}`,
  };
}

export function clientAcknowledgementEmail(e: EnquiryEmailData, contactPhone: string, contactEmail: string) {
  return {
    subject: `We received your enquiry (${e.reference})`,
    html: layout(
      "Thank you for your enquiry",
      `<p style="font-size:15px;line-height:1.6">Dear ${esc(e.name)},</p>
<p style="font-size:15px;line-height:1.6">We have received your project enquiry and will review it. Your reference number is <strong>${esc(e.reference)}</strong>. Please quote it in any correspondence.</p>
${rows([
  ["Service", e.serviceLabel],
  ["Location", e.location],
])}
<p style="font-size:15px;line-height:1.6">If anything is urgent, call ${esc(contactPhone)} or email ${esc(contactEmail)}.</p>
<p style="font-size:15px;line-height:1.6">Zentrik Solutions (Pvt) Ltd</p>`,
    ),
    text: `Dear ${e.name},\n\nWe have received your project enquiry and will review it. Your reference number is ${e.reference}. Please quote it in any correspondence.\n\nService: ${e.serviceLabel}\nLocation: ${e.location}\n\nIf anything is urgent, call ${contactPhone} or email ${contactEmail}.\n\nZentrik Solutions (Pvt) Ltd`,
  };
}

export function quotationEmail(q: {
  reference: string;
  clientName: string;
  projectTitle: string;
  total: string;
  validUntil: string;
}, contactEmail: string) {
  return {
    subject: `Quotation ${q.reference}: ${q.projectTitle}`,
    html: layout(
      "Your quotation",
      `<p style="font-size:15px;line-height:1.6">Dear ${esc(q.clientName)},</p>
<p style="font-size:15px;line-height:1.6">Please find attached quotation <strong>${esc(q.reference)}</strong> for ${esc(q.projectTitle)}.</p>
${rows([
  ["Total (USD)", q.total],
  ["Valid until", q.validUntil],
])}
<p style="font-size:15px;line-height:1.6">Reply to this email or write to ${esc(contactEmail)} with any questions.</p>
<p style="font-size:15px;line-height:1.6">Zentrik Solutions (Pvt) Ltd</p>`,
    ),
    text: `Dear ${q.clientName},\n\nPlease find attached quotation ${q.reference} for ${q.projectTitle}.\n\nTotal (USD): ${q.total}\nValid until: ${q.validUntil}\n\nReply to this email or write to ${contactEmail} with any questions.\n\nZentrik Solutions (Pvt) Ltd`,
  };
}
