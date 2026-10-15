// Gestión de administradores.
import * as React from 'react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { DataTable } from '../../components/ui/data-table';
import { Input } from '../../components/ui/input';
import { Modal } from '../../components/ui/modal';
import { Switch } from '../../components/ui/switch';
import { useToast } from '../../components/ui/toast';
import type { AdminUser } from '../schema';
import { PageHeader } from './AdminShell';
import { api, ApiError } from './api';
import { Icon } from './icons';

type UserRow = AdminUser & { is_active: boolean; last_login_at: string | null; created_at: string };

const fmt = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

export function UsersView({ me }: { me: AdminUser }) {
  const { toast } = useToast();
  const [users, setUsers] = React.useState<UserRow[] | null>(null);
  const [editing, setEditing] = React.useState<UserRow | 'new' | null>(null);
  const [form, setForm] = React.useState({ name: '', email: '', password: '', is_active: true });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<UserRow | null>(null);

  const load = React.useCallback(() => {
    api<{ users: UserRow[] }>('/users').then((r) => setUsers(r.users));
  }, []);
  React.useEffect(load, [load]);

  function open(u: UserRow | 'new') {
    setEditing(u);
    setErrors({});
    setForm(u === 'new' ? { name: '', email: '', password: '', is_active: true } : { ...u, password: '' });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing === 'new') await api('/users', { method: 'POST', body: form });
      else if (editing) await api(`/users/${editing.id}`, { method: 'PUT', body: form });
      toast({ variant: 'success', title: editing === 'new' ? 'Administrador creado' : 'Cambios guardados' });
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
      toast({ variant: 'success', title: 'Administrador borrado' });
      load();
    } catch (err) {
      toast({ variant: 'error', title: err instanceof Error ? err.message : 'No se pudo borrar.' });
    }
    setDeleting(null);
  }

  return (
    <>
      <PageHeader
        title="Administradores"
        description="Personas con acceso al panel. Todas pueden ver y editar todos los módulos."
        icon="user-gear"
        actions={
          <Button onClick={() => open('new')}>
            <Icon name="plus" /> Nuevo administrador
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
        title={editing === 'new' ? 'Nuevo administrador' : 'Editar administrador'}
      >
        <form onSubmit={save} noValidate className="space-y-4">
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
          {editing !== 'new' && editing?.id !== me.id && (
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
