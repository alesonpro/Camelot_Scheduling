import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/guards";

export default async function AgentLayout({ children }: { children: ReactNode }) {
  await requireRole("agent", "admin");
  return children;
}
