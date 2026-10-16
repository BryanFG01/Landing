import { useMemo, useState } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { resolveColumns, toTanstackColumns } from './lib';
import type { UseDataTableOptions } from './types';

/** Orden, búsqueda global, columnas resueltas y paginación de la tabla, listos para pintar. */
export function useDataTable<T extends Record<string, unknown>>({
  data,
  columns,
  children,
  paginate,
  pageSize,
}: UseDataTableOptions<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const resolvedCols = useMemo(() => resolveColumns<T>(columns, children), [columns, children]);
  const tanstackCols = useMemo(() => toTanstackColumns(resolvedCols), [resolvedCols]);

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
  });

  const rows = table.getRowModel().rows;

  return {
    table,
    globalFilter,
    setGlobalFilter,
    colCount: resolvedCols.length,
    headerGroups: table.getHeaderGroups(),
    rows,
    isEmpty: rows.length === 0,
    pageNumber: table.getState().pagination.pageIndex + 1,
    pageCount: Math.max(1, table.getPageCount()),
  };
}
