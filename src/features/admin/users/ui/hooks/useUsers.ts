// Usuarios y permisos: carga, formulario de alta/edición y borrado.
import * as React from 'react';
import { useToast } from '@/shared/ui/toast';
import type { AdminUser } from '@/features/admin/core/domain/schema';
import { api, ApiError, errorMessage } from '@/features/admin/core/ui/api';
import type { Mod } from '@/features/admin/core/ui/lib/modules';
import { EMPTY_USER, formFor, type UserForm, type UserRow } from '../lib/users';

export function useUsers(me: AdminUser) {
  const { toast } = useToast();
  const [users, setUsers] = React.useState<UserRow[] | null>(null);
  const [modules, setModules] = React.useState<Mod[]>([]);
  const [editing, setEditing] = React.useState<UserRow | 'new' | null>(null);
  const [form, setForm] = React.useState<UserForm>(EMPTY_USER);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<UserRow | null>(null);

  const load = React.useCallback(() => {
    api<{ users: UserRow[] }>('/users')
      .then((r) => setUsers(r.users))
      .catch((e) => toast({ variant: 'error', title: errorMessage(e, 'No se pudieron cargar los usuarios.') }));
  }, [toast]);

  React.useEffect(load, [load]);
  React.useEffect(() => {
    api<{ modules: Mod[] }>('/modules')
      .then((r) => setModules(r.modules.filter((m) => m.is_active)))
      .catch(() => setModules([]));
  }, []);

  const moduleNames = React.useMemo(() => new Map(modules.map((m) => [m.id, m.name])), [modules]);

  const open = React.useCallback((u: UserRow | 'new') => {
    setEditing(u);
    setErrors({});
    setForm(formFor(u));
  }, []);

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing === 'new') await api('/users', { method: 'POST', body: form });
      else await api(`/users/${editing.id}`, { method: 'PUT', body: form });
      toast({ variant: 'success', title: editing === 'new' ? 'Usuario creado' : 'Cambios guardados' });
      setEditing(null);
      load();
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) setErrors(err.fieldErrors);
      else toast({ variant: 'error', title: errorMessage(err, 'No se pudo guardar.') });
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
      toast({ variant: 'error', title: errorMessage(err, 'No se pudo borrar.') });
    }
    setDeleting(null);
  }

  return {
    users,
    modules,
    moduleNames,
    editing,
    form,
    errors,
    saving,
    deleting,
    isEditing: editing !== null,
    isNew: editing === 'new',
    isDeleting: deleting !== null,
    /** Editando la propia cuenta: no se puede cambiar el rol ni desactivar. */
    isSelf: editing !== 'new' && editing?.id === me.id,
    setForm: (patch: Partial<UserForm>) => setForm((f) => ({ ...f, ...patch })),
    open,
    close: () => setEditing(null),
    save,
    askDelete: setDeleting,
    cancelDelete: () => setDeleting(null),
    remove,
  };
}
