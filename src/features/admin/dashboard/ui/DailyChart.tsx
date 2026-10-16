// Gráfico de barras de pedidos de la web por día (últimos 14).
import * as React from 'react';
import { Card } from '@/shared/ui/card';
import { barHeights, dayParts, dayShort } from '@/features/admin/core/ui/lib/format';
import type { DailyChartProps } from './SalesPanel.types';

export function DailyChart({ byDay }: Readonly<DailyChartProps>) {
  const heights = barHeights(byDay.map((d) => d.n));
  return (
    // min-w-0: dentro de la cuadrícula, la tarjeta puede encoger por debajo del ancho de las 14 barras (móvil).
    <Card className="min-w-0 p-4">
      <h3 className="text-sm font-semibold text-muted-foreground">Pedidos por día (últimos 14)</h3>
      <ol className="mt-4 flex h-40 items-end gap-1.5" aria-label="Pedidos por día">
        {byDay.map((d, i) => (
          <li key={d.day} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1">
            {/* Zona de la barra: el % de alto es de esta zona (sin el número ni la etiqueta del día). */}
            <span className="flex w-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs tabular-nums text-muted-foreground">{d.n || ''}</span>
              <span
                className="w-full rounded-t-sm bg-primary/80"
                style={{ height: `${heights[i]}%` }}
                title={`${dayShort(d.day)}: ${d.n} pedido(s)`}
              />
            </span>
            <span className="w-full truncate text-center text-xs text-muted-foreground">
              <span className="max-md:hidden">{dayParts(d.day).weekday} </span>
              {dayParts(d.day).num}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
