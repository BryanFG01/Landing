// formatCell mantiene la API de siempre (devuelve el nodo de la celda) para las tablas que ya la usan.
import type * as React from 'react';
import type { ColumnConfig, FieldConfig, Option } from '../domain/schema';
import { CellValue } from './CellValue';

// Se llama a CellValue como función (no tiene hooks) para devolver exactamente el mismo nodo que antes,
// sin añadir un nivel de componente al árbol.
export function formatCell(
  value: unknown,
  column: ColumnConfig,
  field: FieldConfig | undefined,
  relationOptions: Option[] | undefined,
): React.ReactNode {
  return CellValue({ value, column, field, relationOptions });
}
