import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddPropertyForm } from "@/components/properties/add-property-form";
import { createClient } from "@/lib/supabase/server";
import { listActiveProperties } from "@/lib/services/property-service";

export default async function AdminPropertiesPage() {
  const supabase = await createClient();
  const properties = await listActiveProperties(supabase);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Properties</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">No properties yet. Add one below.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {properties.map((property) => (
                <li key={property.id} className="py-2 text-sm">
                  <span className="font-medium">
                    {property.property_name ? `${property.property_name} — ` : ""}
                    {property.address}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {property.city}, {property.state} {property.zip}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <AddPropertyForm />
        </CardContent>
      </Card>
    </div>
  );
}
