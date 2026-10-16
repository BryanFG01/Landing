// Una celda del resultado de la consola: NULL marcado aparte y el resto como texto recortado.
import * as React from 'react';
import { cellText } from '@/features/admin/core/ui/lib/sql';
import type { CellProps } from './ResultView.types';

export function ResultCell({ value }: Readonly<CellProps>) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">NULL</span>;
  return <>{cellText(value)}</>;
}
