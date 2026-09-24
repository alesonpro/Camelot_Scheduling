import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/guards";

export default async function ReceptionistLayout({ children }: { children: ReactNode }) {
  await requireRole("receptionist", "admin");
  return children;
}
