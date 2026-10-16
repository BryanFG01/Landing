// Estadísticas de la web en los últimos 7 días: visitas, clics en WhatsApp, chats y conversión.
import * as React from 'react';
import { StatCard } from '@/shared/ui/stat-card';
import { conversion } from '@/features/admin/core/domain/sales';
import { iconComponent } from '@/features/admin/core/ui/icons';
import type { WebStatsProps } from './SalesPanel.types';

export function WebStats({ sales }: Readonly<WebStatsProps>) {
  const rate = conversion(sales.week, sales.web.visitas);
  return (
    <>
      <h3 className="mt-6 mb-3 text-sm font-semibold text-muted-foreground">La web en los últimos 7 días</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Visitas" value={sales.web.visitas} icon={iconComponent('eye')} />
        <StatCard title="Clics en WhatsApp" value={sales.web.whatsapp} icon={iconComponent('shopping-cart')} />
        <StatCard title="Chats abiertos" value={sales.web.chats} icon={iconComponent('chat')} />
        <StatCard
          title="Pedidos por cada 100 visitas"
          value={rate === null ? '—' : rate.toLocaleString('es-CO')}
          formatValue={false}
          icon={iconComponent('chart')}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Una visita por persona y sesión del navegador. Sin cookies ni datos personales.
      </p>
    </>
  );
}
