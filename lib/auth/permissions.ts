import type { AdminRole } from "@/generated/prisma/enums";

export const PERMISSIONS = [
  "enquiries:read",
  "enquiries:write",
  "enquiries:assign",
  "quotations:read",
  "quotations:write",
  "quotations:send",
  "content:read",
  "content:write",
  "content:publish",
  "media:write",
  "settings:write",
  "users:manage",
  "audit:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL = new Set<Permission>(PERMISSIONS);

const ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<Permission>> = {
  SUPER_ADMIN: ALL,
  ADMIN: new Set(PERMISSIONS.filter((p) => p !== "users:manage")),
  EDITOR: new Set<Permission>(["content:read", "content:write", "content:publish", "media:write"]),
  SALES: new Set<Permission>([
    "enquiries:read",
    "enquiries:write",
    "enquiries:assign",
    "quotations:read",
    "quotations:write",
    "quotations:send",
    "content:read",
  ]),
};

export function can(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}
