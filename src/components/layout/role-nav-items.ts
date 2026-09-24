import type { Role } from "@/lib/auth/roles";
import type { NavItem } from "@/types";

// Add entries here (e.g. "New Showing") as those pages exist. Don't add
// links to pages that don't exist yet.
export function navItemsForRole(role: Role): NavItem[] {
  const items: NavItem[] = [{ label: "Dashboard", href: `/${role}/dashboard` }];

  if (role === "agent") {
    items.push({ label: "My Availability", href: "/agent/availability" });
  }

  if (role === "receptionist") {
    items.push(
      { label: "Find Availability", href: "/receptionist/find-availability" },
      { label: "Agent Schedules", href: "/receptionist/agents" },
      { label: "Showings", href: "/receptionist/showings" },
    );
  }

  if (role === "admin") {
    items.push(
      // Booking itself has no separate admin page — admins are allowed on
      // the receptionist routes (see ROLE_ROUTE_PREFIXES), so reuse them
      // rather than duplicating the search/booking flow.
      { label: "Find Availability", href: "/receptionist/find-availability" },
      { label: "Agents", href: "/admin/agents" },
      { label: "Properties", href: "/admin/properties" },
      { label: "Showings", href: "/admin/showings" },
    );
  }

  return items;
}
