// Panel lateral de la consola: consultas de ejemplo para empezar.
import * as React from 'react';
import { Card } from '@/shared/ui/card';
import { SQL_EXAMPLES } from '@/features/admin/core/ui/lib/sql';
import type { ExamplesPanelProps } from './SidePanels.types';

export function ExamplesPanel({ onPick }: Readonly<ExamplesPanelProps>) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-sans text-sm font-semibold">Ejemplos</h2>
      <ul className="space-y-1">
        {SQL_EXAMPLES.map((ex) => (
          <li key={ex.label}>
            <button type="button" onClick={() => onPick(ex.sql)} className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted">
              {ex.label}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Los registros de los módulos del panel están en la vista <code className="font-mono">registros</code> (columnas
        modulo, data, created_at).
      </p>
    </Card>
  );
}
