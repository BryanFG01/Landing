// Usuarios del panel y sus permisos. Administrador: todo el panel. Usuario: solo los módulos asignados, para ver o
// para editar.
import * as React from 'react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { DataTable } from '../../components/ui/data-table';
import { Input } from '../../components/ui/input';
import { Modal } from '../../components/ui/modal';
import { Select } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { useToast } from '../../components/ui/toast';
import { ROLES, type AdminUser, type ModuleDefinition, type Role } from '../schema';
import { PageHeader } from './AdminShell';
import { api, ApiError } from './api';
import { Icon } from './icons';

type Permission = { module_id: number; can_edit: boolean };
type UserRow = AdminUser & {
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  permissions: Permission[];
};
type Mod = ModuleDefinition & { id: number };

type Form = { name: string; email: string; password: string; is_active: boolean; role: Role; permissions: Permission[] };

const EMPTY: Form = { name: '', email: '', password: '', is_active: true, role: 'usuario', permissions: [] };

const fmt = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

const ACCESS_OPTIONS = [
  { value: 'none', label: 'Sin acceso' },
  { value: 'view', label: 'Ver y exportar' },
  { value: 'edit', label: 'Ver y editar' },
];

/** Un módulo por fila con su nivel de acceso. */
function PermissionsEditor({
  modules,
  value,
  onChange,
}: {
  modules: Mod[];
  value: Permission[];
  onChange: (p: Permission[]) => void;
}) {
  const level = (id: number) => {
    const p = value.find((x) => x.module_id === id);
    return p ? (p.can_edit ? 'edit' : 'view') : 'none';
  };
  const set = (id: number, v: string) =>
    onChange([...value.filter((x) => x.module_id !== id), ...(v === 'none' ? [] : [{ module_id: id, can_edit: v === 'edit' }])]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Módulos que puede usar</p>
        <div className="flex gap-1">
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange(modules.map((m) => ({ module_id: m.id, can_edit: false })))}>
            Todos: ver
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange([])}>
            Ninguno
          </Button>
        </div>
      </div>
      <div className="max-h-72 divide-y divide-border overflow-y-auto rounded-lg border border-border">
        {modules.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-3 py-2">
            <Icon name={m.icon} className="size-4 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-sm">
              {m.name}
              {m.source_type === 'query' && <span className="ml-1 text-xs text-muted-foreground">(consulta)</span>}
            </span>
            <Select
              className="w-40"
              id={`acceso-${m.id}`}
              options={m.source_type === 'query' ? ACCESS_OPTIONS.slice(0, 2) : ACCESS_OPTIONS}
              value={level(m.id)}
              onValueChange={(v) => set(m.id, v)}
            />
          </div>
        ))}
        {!modules.length && <p className="p-3 text-sm text-muted-foreground">Aún no hay módulos.</p>}
      </div>
    </div>
  );
}

export function UsersView({ me }: { me: AdminUser }) {
  const { toast } = useToast();
  const [users, setUsers] = React.useState<UserRow[] | null>(null);
  const [modules, setModules] = React.useState<Mod[]>([]);
  const [editing, setEditing] = React.useState<UserRow | 'new' | null>(null);
  const [form, setForm] = React.useState<Form>(EMPTY);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<UserRow | null>(null);

  const load = React.useCallback(() => {
    api<{ users: UserRow[] }>('/users').then((r) => setUsers(r.users));
  }, []);
  React.useEffect(load, [load]);
  React.useEffect(() => {
    api<{ modules: Mod[] }>('/modules').then((r) => setModules(r.modules.filter((m) => m.is_active)));
  }, []);

  const moduleName = new Map(modules.map((m) => [m.id, m.name]));

  function open(u: UserRow | 'new') {
    setEditing(u);
    setErrors({});
    setForm(
      u === 'new'
        ? EMPTY
        : { name: u.name, email: u.email, password: '', is_active: u.is_active, role: u.role, permissions: u.permissions },
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing === 'new') await api('/users', { method: 'POST', body: form });
      else if (editing) await api(`/users/${editing.id}`, { method: 'PUT', body: form });
      toast({ variant: 'success', title: editing === 'new' ? 'Usuario creado' : 'Cambios guardados' });
      setEditing(null);
      load();
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) setErrors(err.fieldErrors);
      else toast({ variant: 'error', title: err instanceof Error ? err.message : 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    try {
      await api(`/users/${deleting.id}`, { method: 'DELETE' });
      toast({ variant: 'success', title: 'Usuario borrado' });
      load();
    } catch (err) {
      toast({ variant: 'error', title: err instanceof Error ? err.message : 'No se pudo borrar.' });
    }
    setDeleting(null);
  }

  const isSelf = editing !== 'new' && editing?.id === me.id;

  return (
    <>
      <PageHeader
        title="Usuarios y permisos"
        description="Los administradores configuran todo el panel. Los usuarios solo ven los módulos que les asignes, para consultar o para editar."
        icon="user-gear"
        actions={
          <Button onClick={() => open('new')}>
            <Icon name="plus" /> Nuevo usuario
          </Button>
        }
      />
      <Card className="p-4">
        <DataTable
          data={users ?? []}
          loading={!users}
          columns={[
            {
              key: 'name',
              label: 'Nombre',
              render: (v, r) => (
                <span className="font-medium">
                  {String(v)} {r.id === me.id && <span className="text-xs text-muted-foreground">(tú)</span>}
                </span>
              ),
            },
            { key: 'email', label: 'Correo' },
            {
              key: 'role',
              label: 'Acceso',
              render: (v, r) =>
                v === 'admin' ? (
                  <Badge size="sm">Administrador</Badge>
                ) : (
                  <span className="text-sm text-muted-foreground" title={r.permissions.map((p) => moduleName.get(p.module_id)).join(', ')}>
                    {r.permissions.length
                      ? `${r.permissions.length} módulo(s), ${r.permissions.filter((p) => p.can_edit).length} con edición`
                      : 'Sin módulos'}
                  </span>
                ),
            },
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
                    Desactivado
                  </Badge>
                ),
            },
            {
              key: 'last_login_at',
              label: 'Último acceso',
              render: (v) => (v ? fmt.format(new Date(String(v))) : <span className="text-muted-foreground">Nunca</span>),
            },
            {
              key: 'id',
              label: '',
              render: (_, r) => (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => open(r)}>
                    <Icon name="pencil" />
                  </Button>
                  {r.id !== me.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Borrar"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleting(r)}
                    >
                      <Icon name="trash" />
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing === 'new' ? 'Nuevo usuario' : 'Editar usuario'}
        maxWidth="lg"
        className="max-h-[90dvh] overflow-y-auto"
      >
        <form onSubmit={save} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombre *"
              value={form.name}
              errorMessage={errors.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Correo *"
              type="email"
              value={form.email}
              disabled={editing !== 'new'}
              errorMessage={errors.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label={editing === 'new' ? 'Contraseña *' : 'Nueva contraseña'}
              type="password"
              autoComplete="new-password"
              value={form.password}
              errorMessage={errors.password}
              helperText={editing === 'new' ? 'Mínimo 10 caracteres.' : 'Déjala vacía para no cambiarla.'}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Select
              label="Rol"
              options={Object.entries(ROLES).map(([value, label]) => ({ value, label }))}
              value={form.role}
              disabled={isSelf}
              helperText={isSelf ? 'No puedes cambiar tu propio rol.' : undefined}
              onValueChange={(role) => setForm({ ...form, role: role as Role })}
            />
          </div>

          {form.role === 'usuario' ? (
            <PermissionsEditor modules={modules} value={form.permissions} onChange={(permissions) => setForm({ ...form, permissions })} />
          ) : (
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              Un administrador ve y edita todos los módulos, y además usa el constructor, la consola SQL, la apariencia y
              esta pantalla.
            </p>
          )}

          {!isSelf && editing !== 'new' && (
            <Switch
              label="Activo"
              description="Si lo desactivas, se cierra su sesión y no puede entrar."
              checked={form.is_active}
              onCheckedChange={(is_active) => setForm({ ...form, is_active })}
            />
          )}
          <Modal.Footer>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      <Modal
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`¿Borrar a ${deleting?.name}?`}
        description="Perderá el acceso al panel. Sus cambios anteriores siguen en el historial."
        maxWidth="sm"
      >
        <Modal.Footer>
          <Button variant="outline" onClick={() => setDeleting(null)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={remove}>
            Borrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
