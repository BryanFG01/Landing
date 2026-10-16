/**
 * DataTable — API de 3 capas
 *
 * Capa 1 — JSON puro (90% de los casos):
 *   <DataTable data={rows} columns={[{ key: "name", label: "Nombre" }]} />
 *
 * Capa 2 — JSON + render function (celdas personalizadas):
 *   <DataTable data={rows} columns={[{
 *     key: "status",
 *     label: "Estado",
 *     render: (value, row) => <Badge variant={value}>{value}</Badge>
 *   }]} />
 *
 * Capa 3 — Compound components (control total):
 *   <DataTable data={rows}>
 *     <DataTable.Column columnKey="name" label="Nombre" sortable>
 *       {({ value, row }) => <strong>{value}</strong>}
 *     </DataTable.Column>
 *   </DataTable>
 */
import * as React from "react"
import { cn } from "@/shared/lib/utils"
import type { DataTableProps, DataTableType, DataTableWithRefComponent } from './types';
import { DataTableBody } from './DataTableBody';
import { DataTableColumn } from './DataTableColumn';
import { DataTableHeader } from './DataTableHeader';
import { DataTablePagination } from './DataTablePagination';
import { useDataTable } from './useDataTable';

export type { ColumnDef, DataTableColumnProps, DataTableProps } from './types';

// ─── Componente principal ─────────────────────────────────────────────────────
function DataTableInner<T extends Record<string, unknown>>(
  {
    data,
    columns: columnsProp,
    children,
    searchable = false,
    paginate = false,
    pageSize = 10,
    loading = false,
    emptyText = "Sin datos.",
    className,
  }: DataTableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const view = useDataTable<T>({ data, columns: columnsProp, children, paginate, pageSize })
  const { table } = view

  return (
    <div ref={ref} className={cn("w-full space-y-3", className)}>
      {/* Búsqueda */}
      {searchable && (
        <input
          value={view.globalFilter}
          onChange={(e) => view.setGlobalFilter(e.target.value)}
          placeholder="Buscar..."
          aria-label="Buscar en la tabla"
          className={cn(
            "h-9 w-full max-w-xs rounded-md border border-border bg-background",
            "px-3 text-sm text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/40"
          )}
        />
      )}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full caption-bottom text-sm" role="grid">
          <DataTableHeader headerGroups={view.headerGroups} />
          <DataTableBody
            rows={view.rows}
            loading={loading}
            isEmpty={view.isEmpty}
            colCount={view.colCount}
            emptyText={emptyText}
          />
        </table>
      </div>

      {/* Paginación */}
      {paginate && (
        <DataTablePagination
          pageNumber={view.pageNumber}
          pageCount={view.pageCount}
          canPrevious={table.getCanPreviousPage()}
          canNext={table.getCanNextPage()}
          onPrevious={() => table.previousPage()}
          onNext={() => table.nextPage()}
        />
      )}
    </div>
  )
}

// ─── forwardRef con genérico ───────────────────────────────────────────────────
const DataTableWithRef = React.forwardRef(DataTableInner) as DataTableWithRefComponent

const DataTable = Object.assign(DataTableWithRef, {
  Column: DataTableColumn,
}) as DataTableType

DataTable.displayName = "DataTable"

export { DataTable }
