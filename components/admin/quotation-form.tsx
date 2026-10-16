"use client";

import { useState } from "react";
import { ActionForm, TextArea, TextInput, type FormState } from "./form";
import { computeTotals, formatMoney } from "@/lib/quotation/math";

type Item = { description: string; quantity: string; unitPrice: string };

export type QuotationDefaults = {
  enquiryId?: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  projectTitle: string;
  taxName: string;
  taxRate: string;
  validUntil: string;
  terms: string;
  notes: string;
  items: Item[];
};

export function QuotationForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  defaults: QuotationDefaults;
  submitLabel: string;
}) {
  const [items, setItems] = useState<Item[]>(defaults.items.length ? defaults.items : [{ description: "", quantity: "1", unitPrice: "" }]);
  const [taxRate, setTaxRate] = useState(defaults.taxRate);

  let totals: ReturnType<typeof computeTotals> | null = null;
  let totalsError = "";
  try {
    totals = computeTotals(items.map((i) => ({ ...i, quantity: i.quantity || "0", unitPrice: i.unitPrice || "0" })), taxRate || "0");
  } catch (e) {
    totalsError = e instanceof Error ? e.message : "Check the amounts.";
  }

  const set = (i: number, patch: Partial<Item>) => setItems((cur) => cur.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  return (
    <ActionForm action={action} submitLabel={submitLabel}>
      {defaults.enquiryId && <input type="hidden" name="enquiryId" value={defaults.enquiryId} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput name="clientName" label="Client name" defaultValue={defaults.clientName} required />
        <TextInput name="clientCompany" label="Company" defaultValue={defaults.clientCompany} />
        <TextInput name="clientEmail" label="Client email" type="email" defaultValue={defaults.clientEmail} required />
        <TextInput name="clientPhone" label="Client phone" defaultValue={defaults.clientPhone} />
      </div>
      <TextInput name="clientAddress" label="Client address" defaultValue={defaults.clientAddress} />
      <TextInput name="projectTitle" label="Project title" defaultValue={defaults.projectTitle} required />

      <fieldset className="space-y-3">
        <legend className="text-xs font-bold uppercase tracking-wider text-navy-900">Line items (USD)</legend>
        {items.map((it, i) => (
          <div key={i} className="grid gap-2 border border-steel-300 bg-steel-50 p-3 sm:grid-cols-[1fr_6rem_8rem_auto]">
            <input aria-label={`Item ${i + 1} description`} name={`items.${i}.description`} value={it.description} onChange={(e) => set(i, { description: e.target.value })} placeholder="Description" maxLength={500} className="border-2 border-steel-300 bg-white px-3 py-2 text-sm" />
            <input aria-label={`Item ${i + 1} quantity`} name={`items.${i}.quantity`} value={it.quantity} onChange={(e) => set(i, { quantity: e.target.value })} inputMode="decimal" placeholder="Qty" className="border-2 border-steel-300 bg-white px-3 py-2 text-sm" />
            <input aria-label={`Item ${i + 1} unit price`} name={`items.${i}.unitPrice`} value={it.unitPrice} onChange={(e) => set(i, { unitPrice: e.target.value })} inputMode="decimal" placeholder="Unit price" className="border-2 border-steel-300 bg-white px-3 py-2 text-sm" />
            <button type="button" onClick={() => setItems((c) => c.filter((_, j) => j !== i))} disabled={items.length === 1} className="border-2 border-steel-300 px-3 py-2 text-xs font-bold uppercase text-steel-600 disabled:opacity-40">
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setItems((c) => [...c, { description: "", quantity: "1", unitPrice: "" }])} className="border-2 border-navy-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-navy-900">
          Add item
        </button>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-3">
        <TextInput name="taxName" label="Tax name" defaultValue={defaults.taxName} required />
        <div>
          <label htmlFor="taxRate" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-navy-900">Tax rate (%)</label>
          <input id="taxRate" name="taxRate" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} inputMode="decimal" className="w-full border-2 border-steel-300 bg-white px-3 py-2.5 text-sm" />
        </div>
        <TextInput name="validUntil" label="Valid until" type="date" defaultValue={defaults.validUntil} required />
      </div>

      <div aria-live="polite" className="border-l-4 border-accent bg-steel-100 p-4 text-sm">
        {totals ? (
          <dl className="grid max-w-xs grid-cols-2 gap-1">
            <dt>Subtotal</dt><dd className="text-right">{formatMoney(totals.subtotal)}</dd>
            <dt>Tax</dt><dd className="text-right">{formatMoney(totals.taxAmount)}</dd>
            <dt className="font-bold">Total</dt><dd className="text-right font-bold">{formatMoney(totals.total)}</dd>
          </dl>
        ) : (
          <p className="text-red-700">{totalsError}</p>
        )}
        <p className="mt-2 text-xs text-steel-600">Totals are recalculated and rounded on the server when saved.</p>
      </div>

      <TextArea name="terms" label="Terms and conditions" defaultValue={defaults.terms} rows={5} />
      <TextArea name="notes" label="Notes (shown on the quotation)" defaultValue={defaults.notes} rows={3} />
    </ActionForm>
  );
}
