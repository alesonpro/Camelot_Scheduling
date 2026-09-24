import type { Role } from "@/lib/auth/roles";

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone: string | null;
  active: boolean;
};

export type NavItem = {
  label: string;
  href: string;
};
