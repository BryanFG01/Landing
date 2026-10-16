// Celda de la tabla de registros: el valor con el formato de su columna o, en "estado", el selector rápido.
import * as React from 'react';
import { formatCell } from '@/features/admin/core/ui/format';
import { StatusCell } from './StatusCell';
import type { RecordCellProps } from './types';

export function RecordCell({ column, value, row, relationOptions, onStatus }: Readonly<RecordCellProps>) {
  const { config, field, alignClass, statusField } = column;
  if (statusField) return <StatusCell value={value} field={statusField} onChange={(v) => onStatus(row, v)} />;
  return <div className={alignClass}>{formatCell(value, config, field, relationOptions[config.column])}</div>;
}
