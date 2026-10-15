// Inicio del panel: resumen y acceso rápido a los módulos.
import * as React from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { StatCard } from '../../components/ui/stat-card';
import type { AdminUser } from '../schema';
import { PageHeader } from './AdminShell';
import { Icon, iconComponent } from './icons';
import { useRouter } from './router';

export interface DashboardStats {
  modules: {
    module_key: string;
    name: string;
    icon: string | null;
    description: string | null;
    source_type: string;
    /** Null en consultas (no se cuentan). */
    records: number | null;
  }[];
  totalRecords: number;
  /** Solo para administradores. */
  admins: number | null;
  recent: { action: string; created_at: string; user: string | null; module: string | null; record_id: number | null }[];
}

const ACTIONS: Record<string, string> = {
  create: 'creó un registro en',
  update: 'editó un registro de',
  delete: 'borró un registro de',
  import: 'importó registros en',
  export: 'exportó',
  module_create: 'creó el módulo',
  module_update: 'configuró el módulo',
  module_delete: 'borró un módulo',
  login: 'entró al panel',
  user_create: 'creó un usuario',
  user_update: 'editó un usuario',
  user_delete: 'borró un usuario',
  group_create: 'creó un grupo del menú',
  sql: 'ejecutó SQL en la consola',
  appearance_update: 'cambió la apariencia',
};

const fmt = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

export function DashboardView({ user, stats }: { user: AdminUser; stats: DashboardStats }) {
  const { navigate } = useRouter();
  return (
    <>
      <PageHeader title={`Hola, ${user.name.split(' ')[0]}`} description="Resumen del panel de administración." />

      <div className={stats.admins === null ? 'grid gap-4 sm:grid-cols-2' : 'grid gap-4 sm:grid-cols-3'}>
        <StatCard title="Módulos" value={stats.modules.length} icon={iconComponent('squares')} />
        <StatCard title="Registros" value={stats.totalRecords} icon={iconComponent('database')} />
        {stats.admins !== null && <StatCard title="Usuarios activos" value={stats.admins} icon={iconComponent('user-gear')} />}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Módulos</h2>
          {stats.modules.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {stats.modules.map((m) => (
                <a key={m.module_key} href={`/admin/m/${m.module_key}`} className="group">
                  <Card className="flex h-full items-start gap-3 p-4 transition-colors group-hover:border-primary/40">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon name={m.icon} className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">{m.name}</span>
                      <span className="block text-sm text-muted-foreground">
                        {m.records === null
                          ? m.source_type === 'query'
                            ? 'Consulta'
                            : 'Tabla no disponible'
                          : `${m.records} registro(s)`}
                      </span>
                    </span>
                  </Card>
                </a>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              {user.role === 'admin' ? (
                <>
                  <p className="text-sm text-muted-foreground">Aún no hay módulos.</p>
                  <Button className="mt-4" onClick={() => navigate('/admin/modulos/nuevo')}>
                    <Icon name="plus" /> Crear el primero
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aún no tienes módulos asignados. Pide a un administrador que te dé acceso.
                </p>
              )}
            </Card>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Actividad reciente</h2>
          <Card className="divide-y divide-border">
            {stats.recent.length ? (
              stats.recent.map((a, i) => (
                <p key={i} className="px-4 py-3 text-sm">
                  <span className="font-medium">{a.user ?? 'Alguien'}</span>{' '}
                  <span className="text-muted-foreground">{ACTIONS[a.action] ?? a.action}</span>{' '}
                  {a.module && <span className="font-medium">{a.module}</span>}
                  <span className="block text-xs text-muted-foreground">{fmt.format(new Date(a.created_at))}</span>
                </p>
              ))
            ) : (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Sin actividad todavía.</p>
            )}
          </Card>
        </section>
      </div>
    </>
  );
}
