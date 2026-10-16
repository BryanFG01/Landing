// Inicio del panel: resumen y acceso rápido a los módulos.
import * as React from 'react';
import { Card } from '@/shared/ui/card';
import { StatCard } from '@/shared/ui/stat-card';
import { iconComponent } from '@/features/admin/core/ui/icons';
import { isAdminUser } from '@/features/admin/core/ui/lib/roles';
import { PageHeader } from '@/features/admin/core/ui/PageHeader';
import { ActivityItem } from './ActivityItem';
import type { DashboardViewProps } from './DashboardView.types';
import { ModuleCard } from './ModuleCard';
import { NoModules } from './NoModules';
import { SalesPanel } from './SalesPanel';

export function DashboardView({ user, stats }: Readonly<DashboardViewProps>) {
  const showUsers = stats.admins !== null;
  return (
    <>
      <PageHeader title={`Hola, ${user.name.split(' ')[0]}`} description="Resumen del panel de administración." />

      <div className={showUsers ? 'grid gap-4 sm:grid-cols-3' : 'grid gap-4 sm:grid-cols-2'}>
        <StatCard title="Módulos" value={stats.modules.length} icon={iconComponent('squares')} />
        <StatCard title="Registros" value={stats.totalRecords} icon={iconComponent('database')} />
        {showUsers && <StatCard title="Usuarios activos" value={stats.admins!} icon={iconComponent('user-gear')} />}
      </div>

      {stats.sales && <SalesPanel sales={stats.sales} />}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Módulos</h2>
          {stats.modules.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {stats.modules.map((m) => (
                <ModuleCard key={m.module_key} module={m} />
              ))}
            </div>
          ) : (
            <NoModules isAdmin={isAdminUser(user)} />
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Actividad reciente</h2>
          <Card className="divide-y divide-border">
            {stats.recent.length ? (
              stats.recent.map((a) => <ActivityItem key={`${a.created_at}-${a.action}-${a.record_id}`} activity={a} />)
            ) : (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Sin actividad todavía.</p>
            )}
          </Card>
        </section>
      </div>
    </>
  );
}
