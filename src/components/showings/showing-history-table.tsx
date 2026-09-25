import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatTime } from "@/lib/utils/datetime";
import type { ShowingRowData } from "@/components/showings/showing-row";

export function ShowingHistoryTable({
  rows,
  filterDescription,
}: {
  rows: ShowingRowData[];
  filterDescription?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {filterDescription ? `No past showings ${filterDescription}.` : "No past showings yet."}
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Address</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Agent</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.propertyLabel}</TableCell>
            <TableCell>{row.prospectName}</TableCell>
            <TableCell>{row.agentName}</TableCell>
            <TableCell>{formatDate(row.date)}</TableCell>
            <TableCell>{formatTime(`${row.time}:00`)}</TableCell>
            <TableCell className="whitespace-normal">{row.notes || "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
