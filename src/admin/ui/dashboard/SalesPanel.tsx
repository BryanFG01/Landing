// Inicio: pedidos de la web (hoy, 7 días, pendientes, ventas), gráfico por día y productos más pedidos. Solo pinta.
import * as React from 'react';
import { Card } from '../../../components/ui/card';
import { StatCard } from '../../../components/ui/stat-card';
import { conversion, type SalesStats } from '../../sales';
import { iconComponent } from '../icons';
import { barHeights, dayParts, dayShort, formatPesos } from '../lib/format';

function DailyChart({ byDay }: Readonly<{ byDay: SalesStats['byDay'] }>) {
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

function TopProducts({ top }: Readonly<{ top: SalesStats['top'] }>) {
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

function WebStats({ sales }: Readonly<{ sales: SalesStats }>) {
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

export function SalesPanel({ sales }: Readonly<{ sales: SalesStats }>) {
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
