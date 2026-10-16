import { flexRender } from '@tanstack/react-table';
import { SkeletonRow } from './SkeletonRow';
import type { DataTableBodyProps } from './types';

/** Filas que se muestran mientras carga. */
const SKELETON_ROWS = 5;

/** Cuerpo de la tabla: filas de carga, mensaje de vacío o las filas visibles. */
export function DataTableBody<T extends Record<string, unknown>>({
  rows,
  loading,
  isEmpty,
  colCount,
  emptyText,
}: Readonly<DataTableBodyProps<T>>) {
  return (
    <tbody className="divide-y divide-border bg-background">
      {loading ? (
        Array.from({ length: SKELETON_ROWS }).map((_, i) => <SkeletonRow key={i} colCount={colCount} />)
      ) : isEmpty ? (
        <tr>
          <td colSpan={colCount} className="py-12 text-center text-sm text-muted-foreground">
            {emptyText}
          </td>
        </tr>
      ) : (
        rows.map((row) => (
          <tr key={row.id} className="transition-colors hover:bg-muted/30">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="px-4 py-3 text-foreground">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))
      )}
    </tbody>
  );
}
