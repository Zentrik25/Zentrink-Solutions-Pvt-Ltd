import { describe, expect, it } from "vitest";
import { can, PERMISSIONS } from "@/lib/auth/permissions";

describe("role permissions", () => {
  it("super admin has everything", () => {
    for (const p of PERMISSIONS) expect(can("SUPER_ADMIN", p)).toBe(true);
  });
  it("only super admin manages users", () => {
    expect(can("ADMIN", "users:manage")).toBe(false);
    expect(can("EDITOR", "users:manage")).toBe(false);
    expect(can("SALES", "users:manage")).toBe(false);
    expect(can("ADMIN", "settings:write")).toBe(true);
  });
  it("editors manage content but never enquiries or quotations", () => {
    expect(can("EDITOR", "content:publish")).toBe(true);
    expect(can("EDITOR", "media:write")).toBe(true);
    for (const p of ["enquiries:read", "enquiries:write", "quotations:read", "quotations:send", "settings:write"] as const)
      expect(can("EDITOR", p)).toBe(false);
  });
  it("sales handle enquiries and quotations but cannot edit or publish content", () => {
    for (const p of ["enquiries:read", "enquiries:write", "enquiries:assign", "quotations:write", "quotations:send"] as const)
      expect(can("SALES", p)).toBe(true);
    for (const p of ["content:write", "content:publish", "media:write", "settings:write"] as const)
      expect(can("SALES", p)).toBe(false);
  });
});
