export const ROLES = ["admin", "receptionist", "agent"] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: string | null | undefined): value is Role {
  return !!value && (ROLES as readonly string[]).includes(value);
}

export function dashboardPathForRole(role: Role): string {
  return `/${role}/dashboard`;
}

/**
 * Maps a route prefix to the roles allowed to access it. Admin is allowed
 * everywhere per CLAUDE.md §4/§17 ("Admins can manage everything").
 */
export const ROLE_ROUTE_PREFIXES: Record<Role, Role[]> = {
  agent: ["agent", "admin"],
  receptionist: ["receptionist", "admin"],
  admin: ["admin"],
};
