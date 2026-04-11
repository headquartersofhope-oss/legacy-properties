import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DataTable({ columns, data, onRowClick, emptyMessage = "No records found." }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col, i) => (
                <TableHead key={i} className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground py-8">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIdx) => (
                <TableRow
                  key={row.id || rowIdx}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col, colIdx) => (
                    <TableCell key={colIdx} className="text-sm whitespace-nowrap">
                      {col.cell ? col.cell(row) : row[col.accessor] || '—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}