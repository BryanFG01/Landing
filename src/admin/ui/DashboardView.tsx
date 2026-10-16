// Inicio del panel: resumen y acceso rápido a los módulos.
import * as React from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { StatCard } from '../../components/ui/stat-card';
import type { AdminUser, DashboardStats } from '../schema';
import { Icon, iconComponent } from './icons';
import { activityActor, describeAction, formatDateTime, recordsLabel } from './lib/format';
import { SalesPanel } from './dashboard/SalesPanel';
import { PageHeader } from './PageHeader';
import { useRouter } from './router';

type ModuleSummary = DashboardStats['modules'][number];
type Activity = DashboardStats['recent'][number];

function ModuleCard({ module: m }: Readonly<{ module: ModuleSummary }>) {
  return (
    <a href={`/admin/m/${m.module_key}`} className="group">
      <Card className="flex h-full items-start gap-3 p-4 transition-colors group-hover:border-primary/40">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon name={m.icon} className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block font-medium">{m.name}</span>
          <span className="block text-sm text-muted-foreground">{recordsLabel(m.records, m.source_type)}</span>
        </span>
      </Card>
    </a>
  );
}

function NoModules({ isAdmin }: Readonly<{ isAdmin: boolean }>) {
  const { navigate } = useRouter();
  return (
    <Card className="p-6 text-center">
      {isAdmin ? (
        <>
          <p className="text-sm text-muted-foreground">Aún no hay módulos.</p>
          <Button className="mt-4" onClick={() => navigate('/admin/modulos/nuevo')}>
            <Icon name="plus" /> Crear el primero
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Aún no tienes módulos asignados. Pide a un administrador que te dé acceso.</p>
      )}
    </Card>
  );
}

function ActivityItem({ activity: a }: Readonly<{ activity: Activity }>) {
  return (
    <p className="px-4 py-3 text-sm">
      <span className="font-medium">{activityActor(a)}</span>{' '}
      <span className="text-muted-foreground">{describeAction(a.action)}</span>{' '}
      {a.module && <span className="font-medium">{a.module}</span>}
      <span className="block text-xs text-muted-foreground">{formatDateTime(a.created_at)}</span>
    </p>
  );
}

export function DashboardView({ user, stats }: Readonly<{ user: AdminUser; stats: DashboardStats }>) {
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
            <NoModules isAdmin={user.role === 'admin'} />
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
