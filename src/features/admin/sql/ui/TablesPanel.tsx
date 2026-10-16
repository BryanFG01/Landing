// Panel lateral de la consola: tablas y vistas del esquema datos.
import * as React from 'react';
import { Card } from '@/shared/ui/card';
import type { TablesPanelProps } from './SidePanels.types';
import { TableItem } from './TableItem';

export function TablesPanel({ tables, onQuery, onCreateModule }: Readonly<TablesPanelProps>) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-sans text-sm font-semibold">Tablas en datos</h2>
      {tables ? (
        <ul className="space-y-1">
          {tables.map((t) => (
            <TableItem key={t.name} table={t} onQuery={onQuery} onCreateModule={onCreateModule} />
          ))}
          {tables.length === 0 && <li className="text-sm text-muted-foreground">Aún no hay tablas.</li>}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      )}
    </Card>
  );
}
