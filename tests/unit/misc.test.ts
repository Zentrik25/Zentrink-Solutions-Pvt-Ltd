import { describe, expect, it } from "vitest";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { allowedTransitions, canTransition, formatEnquiryReference } from "@/lib/enquiry/workflow";
import { issueFormToken, verifyFormToken } from "@/lib/enquiry/spam";
import { bodyToText, pairs, parseBody } from "@/lib/content/parse";

describe("passwords", () => {
  it("hashes with a unique salt and verifies", async () => {
    const a = await hashPassword("Sup3rSecretPassw0rd");
    const b = await hashPassword("Sup3rSecretPassw0rd");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("Sup3rSecretPassw0rd", a)).toBe(true);
    expect(await verifyPassword("wrong", a)).toBe(false);
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });
  it("enforces the password policy", () => {
    expect(passwordProblem("short1A")).toMatch(/12/);
    expect(passwordProblem("alllowercase1234")).toMatch(/upper/);
    expect(passwordProblem("GoodPassword1234")).toBeNull();
  });
});

describe("enquiry workflow", () => {
  it("follows the defined pipeline", () => {
    expect(canTransition("NEW", "UNDER_REVIEW")).toBe(true);
    expect(canTransition("UNDER_REVIEW", "CONTACTED")).toBe(true);
    expect(canTransition("CONTACTED", "SITE_VISIT_SCHEDULED")).toBe(true);
    expect(canTransition("SITE_VISIT_SCHEDULED", "QUOTATION_PREPARED")).toBe(true);
    expect(canTransition("QUOTATION_PREPARED", "QUOTATION_SENT")).toBe(true);
    expect(canTransition("QUOTATION_SENT", "WON")).toBe(true);
    expect(canTransition("WON", "CLOSED")).toBe(true);
  });
  it("blocks jumps that skip the process", () => {
    expect(canTransition("NEW", "QUOTATION_SENT")).toBe(false);
    expect(canTransition("NEW", "WON")).toBe(false);
    expect(canTransition("WON", "NEW")).toBe(false);
    expect(allowedTransitions("CLOSED")).toEqual(["UNDER_REVIEW"]);
  });
  it("formats references", () => {
    expect(formatEnquiryReference(42, new Date("2026-05-01T00:00:00Z"))).toBe("ZS-ENQ-2026-00042");
  });
});

describe("anti-spam form token", () => {
  it("rejects instant, tampered, missing and expired tokens", () => {
    const t0 = 1_000_000_000_000;
    const token = issueFormToken(t0);
    expect(verifyFormToken(token, t0 + 500)).toBe(false); // too fast
    expect(verifyFormToken(token, t0 + 5_000)).toBe(true);
    expect(verifyFormToken(token, t0 + 3 * 3600_000)).toBe(false); // too old
    expect(verifyFormToken(token.replace(/.$/, "x"), t0 + 5_000)).toBe(false);
    expect(verifyFormToken("", t0)).toBe(false);
    expect(verifyFormToken(undefined, t0)).toBe(false);
  });
});

describe("content text parsing", () => {
  it("round-trips article markup", () => {
    const text = "Intro paragraph.\n\n## Heading\n\nSecond paragraph.\n\n- one\n- two";
    const blocks = parseBody(text);
    expect(blocks.map((b) => b.type)).toEqual(["p", "h2", "p", "ul"]);
    expect(bodyToText(blocks)).toBe(text);
  });
  it("parses pair lines and flags malformed ones", () => {
    const r = pairs("A | one\nbroken\nB | two");
    expect(r.pairs).toEqual([["A", "one"], ["B", "two"]]);
    expect(r.bad).toEqual(["broken"]);
  });
});
