import * as React from 'react';
import type { ColumnDef as TanstackColumnDef, SortDirection } from '@tanstack/react-table';
import type { ColumnDef, DataTableColumnProps, ResolvedColumn, SortIndicator } from './types';

/** Nombre con el que DataTable reconoce sus hijos <DataTable.Column>. */
export const COLUMN_DISPLAY_NAME = 'DataTable.Column';

const SORT_INDICATORS: Record<SortDirection | 'none', SortIndicator> = {
  asc: { ariaSort: 'ascending', arrow: '↑' },
  desc: { ariaSort: 'descending', arrow: '↓' },
  none: { ariaSort: 'none', arrow: '↕' },
};

/** aria-sort y flecha de la cabecera según el orden actual de la columna. */
export function sortIndicator(sorted: false | SortDirection): SortIndicator {
  return SORT_INDICATORS[sorted || 'none'];
}

function isColumnElement(child: React.ReactNode): child is React.ReactElement {
  if (!React.isValidElement(child)) return false;
  return (child.type as { displayName?: string }).displayName === COLUMN_DISPLAY_NAME;
}

function columnsFromChildren<T extends Record<string, unknown>>(children: React.ReactNode): ResolvedColumn<T>[] {
  const cols: ResolvedColumn<T>[] = [];
  React.Children.forEach(children, (child) => {
    if (!isColumnElement(child)) return;
    const p = child.props as DataTableColumnProps<T>;
    cols.push({
      key: p.columnKey,
      label: p.label ?? p.columnKey,
      sortable: p.sortable ?? false,
      render: p.children ? (value, row, index) => p.children!({ value, row, index }) : undefined,
    });
  });
  return cols;
}

/** Resuelve las columnas desde el prop `columns` o desde los hijos <DataTable.Column>. */
export function resolveColumns<T extends Record<string, unknown>>(
  columnsProp: ColumnDef<T>[] | undefined,
  children: React.ReactNode,
): ResolvedColumn<T>[] {
  if (!columnsProp) return columnsFromChildren<T>(children);
  return columnsProp.map((col) => ({
    key: col.key,
    label: col.label ?? col.key,
    sortable: col.sortable ?? false,
    render: col.render,
  }));
}

/** Traduce las columnas resueltas al formato de TanStack Table. */
export function toTanstackColumns<T extends Record<string, unknown>>(cols: ResolvedColumn<T>[]): TanstackColumnDef<T>[] {
  return cols.map((col) => ({
    id: col.key,
    accessorFn: (row) => (row as Record<string, unknown>)[col.key],
    header: col.label,
    enableSorting: col.sortable,
    cell: ({ getValue, row }) =>
      col.render ? col.render(getValue() as unknown, row.original, row.index) : (getValue() as React.ReactNode),
  }));
}
