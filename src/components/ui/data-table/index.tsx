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
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef as TanstackColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { cn } from "../../lib/utils"

// ─── Tipos públicos ────────────────────────────────────────────────────────────
export interface ColumnDef<T extends Record<string, unknown> = Record<string, unknown>> {
  key: string
  label?: string
  sortable?: boolean
  width?: string | number
  render?: (value: unknown, row: T, index: number) => React.ReactNode
}

export interface DataTableColumnProps<T extends Record<string, unknown> = Record<string, unknown>> {
  columnKey: string
  label?: string
  sortable?: boolean
  width?: string | number
  children?: (ctx: { value: unknown; row: T; index: number }) => React.ReactNode
}

export interface DataTableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  data: T[]
  columns?: ColumnDef<T>[]
  children?: React.ReactNode
  searchable?: boolean
  paginate?: boolean
  pageSize?: number
  loading?: boolean
  emptyText?: string
  className?: string
}

// ─── DataTable.Column (compound) ──────────────────────────────────────────────
// No renderiza nada; DataTable lee sus props para construir las columnas.
function DataTableColumn<T extends Record<string, unknown>>(
  _props: DataTableColumnProps<T>
): null {
  return null
}
DataTableColumn.displayName = "DataTable.Column"

// ─── Internos ─────────────────────────────────────────────────────────────────
interface ResolvedColumn<T extends Record<string, unknown>> {
  key: string
  label: string
  sortable: boolean
  render?: (value: unknown, row: T, index: number) => React.ReactNode
}

function SkeletonRow({ colCount }: { colCount: number }) {
  return (
    <tr>
      {Array.from({ length: colCount }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
        </td>
      ))}
    </tr>
  )
}

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
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")

  // Resuelve columnas desde el prop `columns` o desde los children de tipo Column
  const resolvedCols = React.useMemo<ResolvedColumn<T>[]>(() => {
    if (columnsProp) {
      return columnsProp.map((col) => ({
        key: col.key,
        label: col.label ?? col.key,
        sortable: col.sortable ?? false,
        render: col.render,
      }))
    }

    const cols: ResolvedColumn<T>[] = []
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return
      if (
        (child.type as { displayName?: string }).displayName !== "DataTable.Column"
      )
        return

      const p = child.props as DataTableColumnProps<T>
      cols.push({
        key: p.columnKey,
        label: p.label ?? p.columnKey,
        sortable: p.sortable ?? false,
        render: p.children
          ? (value, row, index) => p.children!({ value, row, index })
          : undefined,
      })
    })
    return cols
  }, [columnsProp, children])

  const tanstackCols = React.useMemo<TanstackColumnDef<T>[]>(
    () =>
      resolvedCols.map((col) => ({
        id: col.key,
        accessorFn: (row) => (row as Record<string, unknown>)[col.key],
        header: col.label,
        enableSorting: col.sortable,
        cell: ({ getValue, row }) =>
          col.render
            ? col.render(getValue() as unknown, row.original, row.index)
            : (getValue() as React.ReactNode),
      })),
    [resolvedCols]
  )

  const table = useReactTable({
    data,
    columns: tanstackCols,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(paginate
      ? {
          getPaginationRowModel: getPaginationRowModel(),
          initialState: { pagination: { pageSize } },
        }
      : {}),
  })

  return (
    <div ref={ref} className={cn("w-full space-y-3", className)}>
      {/* Búsqueda */}
      {searchable && (
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
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
          <thead className="border-b border-border bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      style={
                        header.column.columnDef.size
                          ? { width: header.column.columnDef.size }
                          : undefined
                      }
                      className={cn(
                        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                        header.column.getCanSort() &&
                          "cursor-pointer select-none hover:text-foreground transition-colors"
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                          ? "descending"
                          : "none"
                      }
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="text-muted-foreground/50" aria-hidden="true">
                            {sorted === "asc" ? "↑" : sorted === "desc" ? "↓" : "↕"}
                          </span>
                        )}
                      </span>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-border bg-background">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} colCount={resolvedCols.length} />
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={resolvedCols.length}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-foreground">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {paginate && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {Math.max(1, table.getPageCount())}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className={cn(
                "rounded-md border border-border px-3 py-1 text-sm transition-colors",
                "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              )}
              aria-label="Página anterior"
            >
              ← Anterior
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className={cn(
                "rounded-md border border-border px-3 py-1 text-sm transition-colors",
                "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              )}
              aria-label="Página siguiente"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── forwardRef con genérico ───────────────────────────────────────────────────
const DataTableWithRef = React.forwardRef(DataTableInner) as <
  T extends Record<string, unknown>
>(
  props: DataTableProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement | null

type DataTableType = typeof DataTableWithRef & {
  Column: typeof DataTableColumn
  displayName?: string
}

const DataTable = Object.assign(DataTableWithRef, {
  Column: DataTableColumn,
}) as DataTableType

DataTable.displayName = "DataTable"

export { DataTable }
