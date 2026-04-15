import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DataTable({ columns, data, onRowClick, emptyMessage = "No records found." }) {
  return (
    <div className="bg-card border-2 border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 border-b-2 border-border">
              {columns.map((col, i) => (
                <TableHead key={i} className="text-xs font-bold text-foreground/70 whitespace-nowrap uppercase tracking-wider py-3">
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
                  className={onRowClick ? "cursor-pointer hover:bg-muted/60 transition-colors duration-150 border-b border-border/50" : "border-b border-border/50"}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col, colIdx) => (
                    <TableCell key={colIdx} className="text-sm py-3">
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