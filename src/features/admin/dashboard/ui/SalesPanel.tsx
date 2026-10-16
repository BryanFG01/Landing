// Inicio: pedidos de la web (hoy, 7 días, pendientes, ventas), gráfico por día y productos más pedidos. Solo pinta.
import * as React from 'react';
import { StatCard } from '@/shared/ui/stat-card';
import { iconComponent } from '@/features/admin/core/ui/icons';
import { formatPesos } from '@/features/admin/core/ui/lib/format';
import { DailyChart } from './DailyChart';
import type { SalesPanelProps } from './SalesPanel.types';
import { TopProducts } from './TopProducts';
import { WebStats } from './WebStats';

export function SalesPanel({ sales }: Readonly<SalesPanelProps>) {
  return (
    <section className="mt-6" aria-labelledby="ventas-title">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="ventas-title" className="text-sm font-semibold text-muted-foreground">
          Pedidos de la web
        </h2>
        <a href="/admin/m/pedidos_web" className="text-sm text-primary underline-offset-4 hover:underline">
          Ver pedidos
        </a>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Hoy" value={sales.today} icon={iconComponent('shopping-cart')} />
        <StatCard title="Últimos 7 días" value={sales.week} icon={iconComponent('calendar')} />
        <StatCard title="Por atender" value={sales.pending} icon={iconComponent('truck')} />
        <StatCard title="Ventas 7 días (aprox.)" value={formatPesos(sales.weekTotal)} formatValue={false} icon={iconComponent('money')} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_380px]">
        <DailyChart byDay={sales.byDay} />
        <TopProducts top={sales.top} />
      </div>
      <WebStats sales={sales} />
    </section>
  );
}
