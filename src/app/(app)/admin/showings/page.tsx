import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShowingRow } from "@/components/showings/showing-row";
import { ShowingHistoryTable } from "@/components/showings/showing-history-table";
import { ShowingsPropertyFilter } from "@/components/showings/showings-property-filter";
import { ShowingsTabs, type ShowingsTab } from "@/components/showings/showings-tabs";
import { createClient } from "@/lib/supabase/server";
import { listPastShowings, listUpcomingShowings } from "@/lib/services/showing-service";
import { listActiveProperties } from "@/lib/services/property-service";
import { toShowingRowData } from "@/lib/utils/showings";

type SearchParams = Promise<{ tab?: string; property?: string }>;

export default async function AdminShowingsPage({ searchParams }: { searchParams: SearchParams }) {
  const { tab, property } = await searchParams;
  const activeTab: ShowingsTab = tab === "past" ? "past" : "upcoming";
  const propertyId = property || "";
  const supabase = await createClient();
  const [properties, showings] = await Promise.all([
    listActiveProperties(supabase),
    activeTab === "past"
      ? listPastShowings(supabase, { propertyId: propertyId || undefined })
      : listUpcomingShowings(supabase, { propertyId: propertyId || undefined }),
  ]);
  const rows = showings.map(toShowingRowData);
  const selectedProperty = properties.find((p) => p.id === propertyId);
  const selectedPropertyLabel = selectedProperty
    ? `${selectedProperty.property_name ? `${selectedProperty.property_name} — ` : ""}${selectedProperty.address}`
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <ShowingsTabs activeTab={activeTab} basePath="/admin/showings" propertyId={propertyId || undefined} />
        <ShowingsPropertyFilter
          properties={properties}
          propertyId={propertyId}
          activeTab={activeTab}
          basePath="/admin/showings"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{activeTab === "past" ? "Past Showings" : "All Upcoming Showings"}</CardTitle>
        </CardHeader>
        <CardContent>
          {activeTab === "past" ? (
            <ShowingHistoryTable rows={rows} propertyLabel={selectedPropertyLabel} />
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No showings scheduled.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {rows.map((row) => (
                <ShowingRow key={row.id} showing={row} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
