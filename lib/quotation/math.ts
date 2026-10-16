import Decimal from "decimal.js";

// Money maths uses arbitrary-precision decimals with half-up rounding. Never JS floats.
const D = Decimal.clone({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export type ItemInput = { description: string; quantity: string | number; unitPrice: string | number };

export type ComputedItem = ItemInput & { quantity: string; unitPrice: string; lineTotal: string };

export type Totals = {
  items: ComputedItem[];
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
};

const NUMBER_RE = /^\d{1,9}(\.\d{1,3})?$/;
const MONEY_RE = /^\d{1,11}(\.\d{1,2})?$/;

export class QuotationMathError extends Error {}

export function parseQuantity(v: string | number): Decimal {
  const s = String(v).trim();
  if (!NUMBER_RE.test(s)) throw new QuotationMathError("Quantity must be a positive number with up to 3 decimals.");
  const d = new D(s);
  if (d.lte(0)) throw new QuotationMathError("Quantity must be greater than zero.");
  return d;
}

export function parseMoney(v: string | number): Decimal {
  const s = String(v).trim();
  if (!MONEY_RE.test(s)) throw new QuotationMathError("Prices must be amounts with up to 2 decimals.");
  return new D(s);
}

export function parseTaxRate(v: string | number): Decimal {
  const s = String(v).trim();
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(s)) throw new QuotationMathError("Tax rate must be a percentage with up to 2 decimals.");
  const d = new D(s);
  if (d.gt(100)) throw new QuotationMathError("Tax rate cannot exceed 100%.");
  return d;
}

export function computeTotals(items: ItemInput[], taxRatePercent: string | number): Totals {
  if (items.length === 0) throw new QuotationMathError("Add at least one line item.");
  const rate = parseTaxRate(taxRatePercent);
  let subtotal = new D(0);
  const computed = items.map((item) => {
    const qty = parseQuantity(item.quantity);
    const price = parseMoney(item.unitPrice);
    const lineTotal = qty.times(price).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    subtotal = subtotal.plus(lineTotal);
    return {
      description: item.description,
      quantity: qty.toFixed(3),
      unitPrice: price.toFixed(2),
      lineTotal: lineTotal.toFixed(2),
    };
  });
  const taxAmount = subtotal.times(rate).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const total = subtotal.plus(taxAmount);
  return {
    items: computed,
    subtotal: subtotal.toFixed(2),
    taxRate: rate.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    total: total.toFixed(2),
  };
}

export function formatMoney(value: string | number | { toString(): string }): string {
  const [int, frac = "00"] = new D(String(value)).toFixed(2).split(".");
  return `US$ ${int!.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${frac}`;
}

export function formatQuotationReference(seq: number, date = new Date()): string {
  return `ZS-Q-${date.getUTCFullYear()}-${String(seq).padStart(4, "0")}`;
}
