// Selector compacto del estado en la fila (pedidos: pendiente, confirmado, entregado…).
import * as React from 'react';
import type { StatusCellProps } from './types';

export function StatusCell({ value, field, onChange }: Readonly<StatusCellProps>) {
  return (
    <select
      aria-label={field.label}
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {field.options?.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
