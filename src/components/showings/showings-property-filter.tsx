"use client";

import Link from "next/link";

import { Label } from "@/components/ui/label";
import type { Database } from "@/lib/db/types";
import type { ShowingsTab } from "@/components/showings/showings-tabs";

type Property = Database["public"]["Tables"]["properties"]["Row"];

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ShowingsPropertyFilter({
  properties,
  propertyId,
  activeTab,
  basePath,
}: {
  properties: Property[];
  propertyId: string;
  activeTab: ShowingsTab;
  basePath: string;
}) {
  return (
    <form className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="tab" value={activeTab} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="property">Property</Label>
        <select
          id="property"
          name="property"
          defaultValue={propertyId}
          className={selectClass}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          <option value="">All properties</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.property_name ? `${property.property_name} — ` : ""}
              {property.address}
            </option>
          ))}
        </select>
      </div>
      {propertyId && (
        <Link
          href={`${basePath}?tab=${activeTab}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          Clear
        </Link>
      )}
    </form>
  );
}
