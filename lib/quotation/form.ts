/** Converts `items.N.field` form entries into the structured quotation input. */
export function quotationFromForm(fd: FormData) {
  const get = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" ? v : "";
  };
  const idx = new Set<number>();
  for (const key of fd.keys()) {
    const m = /^items\.(\d+)\./.exec(key);
    if (m) idx.add(Number(m[1]));
  }
  const items = [...idx].sort((a, b) => a - b).map((i) => ({
    description: get(`items.${i}.description`),
    quantity: get(`items.${i}.quantity`),
    unitPrice: get(`items.${i}.unitPrice`),
  })).filter((i) => i.description || i.unitPrice);
  return {
    enquiryId: get("enquiryId") || undefined,
    clientName: get("clientName"),
    clientCompany: get("clientCompany") || undefined,
    clientEmail: get("clientEmail"),
    clientPhone: get("clientPhone") || undefined,
    clientAddress: get("clientAddress") || undefined,
    projectTitle: get("projectTitle"),
    taxName: get("taxName"),
    taxRate: get("taxRate"),
    validUntil: get("validUntil"),
    terms: get("terms"),
    notes: get("notes") || undefined,
    items,
  };
}

