// Constructor: lista de módulos y grupos del menú.
import * as React from 'react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { DataTable } from '../../components/ui/data-table';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/toast';
import type { ModuleDefinition, ModuleGroup } from '../schema';
import { PageHeader } from './AdminShell';
import { api } from './api';
import { Icon } from './icons';
import { useNav } from './nav';
import { useRouter } from './router';

type Mod = ModuleDefinition & { id: number };

function GroupsCard({ initial }: { initial: ModuleGroup[] }) {
  const { toast } = useToast();
  const { refreshNav } = useNav();
  const [groups, setGroups] = React.useState(initial);
  const [name, setName] = React.useState('');

  async function run(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      const r = await api<{ groups: ModuleGroup[] }>('/groups');
      setGroups(r.groups);
      await refreshNav();
      toast({ variant: 'success', title: ok });
    } catch (err) {
      toast({ variant: 'error', title: err instanceof Error ? err.message : 'No se pudo guardar.' });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Grupos del menú</CardTitle>
        <CardDescription>Los apartados en los que se ordenan los módulos del sidebar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {groups.map((g) => (
          <GroupRow
            key={g.id}
            group={g}
            onSave={(patch) => run(() => api(`/groups/${g.id}`, { method: 'PUT', body: { ...g, ...patch } }), 'Grupo guardado')}
            onDelete={() => run(() => api(`/groups/${g.id}`, { method: 'DELETE' }), 'Grupo borrado')}
          />
        ))}
        <form
          className="flex gap-2 pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            run(() => api('/groups', { method: 'POST', body: { name, sort_order: groups.length } }), 'Grupo creado').then(
              () => setName(''),
            );
          }}
        >
          <div className="flex-1">
            <Input placeholder="Nuevo grupo, p. ej. Ventas" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button type="submit" variant="outline">
            <Icon name="plus" /> Añadir
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function GroupRow({
  group,
  onSave,
  onDelete,
}: {
  group: ModuleGroup;
  onSave: (patch: Partial<ModuleGroup>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = React.useState(group.name);
  const [order, setOrder] = React.useState(String(group.sort_order));
  const dirty = name !== group.name || order !== String(group.sort_order);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <Input aria-label="Nombre del grupo" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="w-20">
        <Input aria-label="Posición" type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
      </div>
      <Button variant="outline" size="sm" disabled={!dirty} onClick={() => onSave({ name, sort_order: Number(order) || 0 })}>
        Guardar
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Borrar grupo ${group.name}`}
        className="text-destructive hover:text-destructive"
        onClick={onDelete}
      >
        <Icon name="trash" />
      </Button>
    </div>
  );
}

export function ModulesList({ modules, groups }: { modules: Mod[]; groups: ModuleGroup[] }) {
  const { navigate } = useRouter();
  const groupName = new Map(groups.map((g) => [g.id, g.name]));
  const rows = modules.map((m) => ({
    id: m.id,
    name: m.name,
    module_key: m.module_key,
    icon: m.icon,
    group: m.group_id ? (groupName.get(m.group_id) ?? '—') : 'Sin grupo',
    source: m.source_type === 'table' ? `Tabla ${m.source}` : m.source_type === 'query' ? 'Consulta SQL' : 'Registros',
    fields: m.fields.length,
    filters: m.filters.length,
    is_active: m.is_active,
  }));

  return (
    <>
      <PageHeader
        title="Constructor de módulos"
        description="Cada módulo es una entrada del menú con su formulario, su tabla y sus filtros. Puede guardar sus propios registros, editar una tabla de la base o mostrar una consulta SQL."
        icon="wrench"
        actions={
          <Button onClick={() => navigate('/admin/modulos/nuevo')}>
            <Icon name="plus" /> Nuevo módulo
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-4">
          <DataTable
            data={rows}
            searchable
            emptyText="Aún no hay módulos. Crea el primero."
            columns={[
              {
                key: 'name',
                label: 'Módulo',
                sortable: true,
                render: (_, r) => (
                  <a href={`/admin/modulos/${r.id}`} className="flex items-center gap-2 font-medium hover:text-primary">
                    <Icon name={r.icon} className="size-4 text-muted-foreground" />
                    {r.name}
                  </a>
                ),
              },
              { key: 'module_key', label: 'Clave', render: (v) => <code className="text-xs">{String(v)}</code> },
              { key: 'group', label: 'Grupo', sortable: true },
              { key: 'source', label: 'Origen', sortable: true },
              { key: 'fields', label: 'Campos' },
              { key: 'filters', label: 'Filtros' },
              {
                key: 'is_active',
                label: 'Estado',
                render: (v) =>
                  v ? (
                    <Badge variant="success" size="sm" dot>
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="muted" size="sm">
                      Inactivo
                    </Badge>
                  ),
              },
              {
                key: 'id',
                label: '',
                render: (_, r) => (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/m/${r.module_key}`)}>
                      Abrir
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/admin/modulos/${r.id}`)}>
                      Configurar
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </Card>
        <GroupsCard initial={groups} />
      </div>
    </>
  );
}
