// Productos más pedidos en la web en los últimos 30 días.
import * as React from 'react';
import { Card } from '@/shared/ui/card';
import type { TopProductsProps } from './SalesPanel.types';

export function TopProducts({ top }: Readonly<TopProductsProps>) {
  return (
    <Card className="min-w-0 p-4">
      <h3 className="text-sm font-semibold text-muted-foreground">Más pedidos (30 días)</h3>
      {top.length ? (
        <ol className="mt-3 divide-y divide-border">
          {top.map((p, i) => (
            <li key={p.nombre} className="flex items-center gap-3 py-2 text-sm">
              <span className="w-4 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">{p.nombre}</span>
              <span className="font-medium tabular-nums">{p.cantidad}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Aún no hay pedidos este mes.</p>
      )}
    </Card>
  );
}
