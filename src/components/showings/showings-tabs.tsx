import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ShowingsTab = "upcoming" | "past";

export function ShowingsTabs({
  activeTab,
  basePath,
  propertyId,
}: {
  activeTab: ShowingsTab;
  basePath: string;
  propertyId?: string;
}) {
  const tabs: { key: ShowingsTab; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
  ];

  const hrefFor = (tab: ShowingsTab) => {
    const params = new URLSearchParams();
    if (tab === "past") params.set("tab", "past");
    if (propertyId) params.set("property", propertyId);
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <div className="flex gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={hrefFor(tab.key)}
          className={cn(buttonVariants({ variant: activeTab === tab.key ? "default" : "outline", size: "sm" }))}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
