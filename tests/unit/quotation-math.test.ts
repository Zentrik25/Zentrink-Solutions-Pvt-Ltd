import { describe, expect, it } from "vitest";
import { computeTotals, formatMoney, formatQuotationReference, parseMoney, parseQuantity, QuotationMathError } from "@/lib/quotation/math";

describe("quotation maths (decimal-accurate)", () => {
  it("avoids floating point drift", () => {
    // 0.1 + 0.2 style trap: 3 x 0.10 + 3 x 0.20 must be exactly 0.90
    const t = computeTotals(
      [
        { description: "a", quantity: "3", unitPrice: "0.10" },
        { description: "b", quantity: "3", unitPrice: "0.20" },
      ],
      "0",
    );
    expect(t.subtotal).toBe("0.90");
    expect(t.total).toBe("0.90");
  });

  it("computes line totals, tax and total with half-up rounding", () => {
    const t = computeTotals([{ description: "Cable", quantity: "2.5", unitPrice: "19.99" }], "15");
    expect(t.items[0]!.lineTotal).toBe("49.98"); // 49.975 -> 49.98
    expect(t.subtotal).toBe("49.98");
    expect(t.taxAmount).toBe("7.50"); // 7.497 -> 7.50
    expect(t.total).toBe("57.48");
  });

  it("rounds each line before summing so the document foots", () => {
    const many = computeTotals(Array.from({ length: 3 }, () => ({ description: "x", quantity: "0.333", unitPrice: "1.00" })), "0");
    expect(many.items.map((i) => i.lineTotal)).toEqual(["0.33", "0.33", "0.33"]);
    expect(many.subtotal).toBe("0.99");
  });

  it("handles large amounts exactly", () => {
    const t = computeTotals([{ description: "Plant", quantity: "1", unitPrice: "99999999.99" }], "15");
    expect(t.taxAmount).toBe("15000000.00"); // 14999999.9985 -> 15000000.00
    expect(t.total).toBe("114999999.99");
  });

  it("rejects invalid input", () => {
    expect(() => computeTotals([], "15")).toThrow(QuotationMathError);
    expect(() => parseQuantity("0")).toThrow(QuotationMathError);
    expect(() => parseQuantity("-1")).toThrow(QuotationMathError);
    expect(() => parseQuantity("1.2345")).toThrow(QuotationMathError);
    expect(() => parseMoney("12.345")).toThrow(QuotationMathError);
    expect(() => parseMoney("abc")).toThrow(QuotationMathError);
    expect(() => computeTotals([{ description: "x", quantity: "1", unitPrice: "1" }], "101")).toThrow(QuotationMathError);
    expect(() => computeTotals([{ description: "x", quantity: "1", unitPrice: "1" }], "-1")).toThrow(QuotationMathError);
  });

  it("formats USD with grouping", () => {
    expect(formatMoney("1234567.5")).toBe("US$ 1,234,567.50");
    expect(formatMoney("0")).toBe("US$ 0.00");
  });

  it("formats references", () => {
    expect(formatQuotationReference(7, new Date("2026-03-01T00:00:00Z"))).toBe("ZS-Q-2026-0007");
  });
});
