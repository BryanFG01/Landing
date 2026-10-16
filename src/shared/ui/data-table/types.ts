import type * as React from 'react';
import type { HeaderGroup, Row } from '@tanstack/react-table';

// ─── Tipos públicos ────────────────────────────────────────────────────────────
export interface ColumnDef<T extends Record<string, unknown> = Record<string, unknown>> {
  key: string;
  label?: string;
  sortable?: boolean;
  width?: string | number;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export interface DataTableColumnProps<T extends Record<string, unknown> = Record<string, unknown>> {
  columnKey: string;
  label?: string;
  sortable?: boolean;
  width?: string | number;
  children?: (ctx: { value: unknown; row: T; index: number }) => React.ReactNode;
}

export interface DataTableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  data: T[];
  columns?: ColumnDef<T>[];
  children?: React.ReactNode;
  searchable?: boolean;
  paginate?: boolean;
  pageSize?: number;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

// ─── Internos ─────────────────────────────────────────────────────────────────
export interface ResolvedColumn<T extends Record<string, unknown>> {
  key: string;
  label: string;
  sortable: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export interface SkeletonRowProps {
  colCount: number;
}

/** Entrada de useDataTable: las props de la tabla que afectan al estado, con los valores por defecto ya puestos. */
export type UseDataTableOptions<T extends Record<string, unknown>> = Pick<
  DataTableProps<T>,
  'data' | 'columns' | 'children'
> & { paginate: boolean; pageSize: number };

/** Cómo se anuncia y se dibuja el orden de una columna. */
export interface SortIndicator {
  ariaSort: 'ascending' | 'descending' | 'none';
  arrow: string;
}

export interface DataTableHeaderProps<T extends Record<string, unknown>> {
  headerGroups: HeaderGroup<T>[];
}

export interface DataTableBodyProps<T extends Record<string, unknown>> {
  rows: Row<T>[];
  loading: boolean;
  isEmpty: boolean;
  colCount: number;
  emptyText: string;
}

export interface DataTablePaginationProps {
  pageNumber: number;
  pageCount: number;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

/** Firma de DataTable tras forwardRef, conservando el genérico `T`. */
export type DataTableWithRefComponent = <T extends Record<string, unknown>>(
  props: DataTableProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement | null;

/** DataTable.Column: no renderiza nada; DataTable lee sus props. */
export type DataTableColumnComponent = (<T extends Record<string, unknown>>(_props: DataTableColumnProps<T>) => null) & {
  displayName: string;
};

export type DataTableType = DataTableWithRefComponent & {
  Column: DataTableColumnComponent;
  displayName?: string;
};
