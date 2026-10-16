import { COLUMN_DISPLAY_NAME } from './lib';
import type { DataTableColumnProps } from './types';

/** DataTable.Column (compuesto). No renderiza nada; DataTable lee sus props para construir las columnas. */
export function DataTableColumn<T extends Record<string, unknown>>(_props: DataTableColumnProps<T>): null {
  return null;
}
DataTableColumn.displayName = COLUMN_DISPLAY_NAME;
