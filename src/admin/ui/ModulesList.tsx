// Constructor: lista de módulos y grupos del menú.
import * as React from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { DataTable, type ColumnDef } from '../../components/ui/data-table';
import { Input } from '../../components/ui/input';
import type { ModuleGroup } from '../schema';
import { useGroups } from './hooks/useGroups';
import { Icon } from './icons';
import { moduleRows, type Mod, type ModuleRow } from './lib/modules';
import { PageHeader } from './PageHeader';
import { useRouter } from './router';
import { StatusBadge } from './StatusBadge';

function GroupRow({
  group,
  onSave,
  onDelete,
}: Readonly<{ group: ModuleGroup; onSave: (patch: Partial<ModuleGroup>) => void; onDelete: () => void }>) {
  // Borrador local del formulario de la fila (solo visual hasta pulsar Guardar).
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

function GroupsCard({ initial }: Readonly<{ initial: ModuleGroup[] }>) {
  const groups = useGroups(initial);
  const [name, setName] = React.useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim() && (await groups.create(name))) setName('');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Grupos del menú</CardTitle>
        <CardDescription>Los apartados en los que se ordenan los módulos del sidebar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {groups.groups.map((g) => (
          <GroupRow key={g.id} group={g} onSave={(patch) => groups.update(g, patch)} onDelete={() => groups.remove(g)} />
        ))}
        <form className="flex gap-2 pt-2" onSubmit={submit}>
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

/** Columnas de la tabla del constructor (presentación). */
function columnsFor(navigate: (to: string) => void): ColumnDef<ModuleRow>[] {
  return [
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
    { key: 'is_active', label: 'Estado', render: (v) => <StatusBadge active={v === true} /> },
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
  ];
}

export function ModulesList({ modules, groups }: Readonly<{ modules: Mod[]; groups: ModuleGroup[] }>) {
  const { navigate } = useRouter();
  const rows = React.useMemo(() => moduleRows(modules, groups), [modules, groups]);
  const columns = React.useMemo(() => columnsFor(navigate), [navigate]);

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
          <DataTable data={rows} searchable emptyText="Aún no hay módulos. Crea el primero." columns={columns} />
        </Card>
        <GroupsCard initial={groups} />
      </div>
    </>
  );
}
