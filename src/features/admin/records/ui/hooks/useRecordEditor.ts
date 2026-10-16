// Alta, edición y borrado de una fila de un módulo. `onChanged` recarga la lista tras guardar o borrar.
import * as React from 'react';
import { useToast } from '@/shared/ui/toast';
import type { RecordRow } from '@/features/admin/core/domain/schema';
import { api, ApiError, errorMessage } from '@/features/admin/core/ui/api';
import { rowPath, type ViewModule } from '../lib/moduleView';
import { initialValues, type FormValues } from '../lib/recordForm';
import { useNav } from '@/features/admin/core/ui/nav';

/** `deploy`: si el registro es un producto del catálogo de la web, el resultado de pedir a Vercel que la actualice. */
type SaveResult = { deploy?: 'ok' | 'sin_hook' | 'error' | null };

const WEB_UPDATING = 'La web se actualiza en 1 o 2 minutos.';

function savedMessage(created: boolean, deploy: SaveResult['deploy']) {
  const base = created ? 'Registro creado' : 'Cambios guardados';
  return deploy === 'ok' ? `${base}. ${WEB_UPDATING}` : base;
}

export function useRecordEditor(mod: ViewModule, onChanged: () => void) {
  const { toast } = useToast();
  // El menú cuenta los pendientes: tras guardar o borrar, se actualiza ya.
  const { refreshNav } = useNav();
  const [editing, setEditing] = React.useState<RecordRow | 'new' | null>(null);
  const [values, setValues] = React.useState<FormValues>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<RecordRow | null>(null);

  const open = React.useCallback(
    (row: RecordRow | 'new') => {
      setEditing(row);
      setValues(initialValues(mod.fields, row === 'new' ? null : row));
      setErrors({});
    },
    [mod.fields],
  );

  const setValue = React.useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Al tocar un campo desaparece su error.
    setErrors(({ [key]: _, ...rest }) => rest);
  }, []);

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      const r =
        editing === 'new'
          ? await api<SaveResult>(`/m/${mod.module_key}`, { method: 'POST', body: values })
          : await api<SaveResult>(rowPath(mod.module_key, editing.__id), { method: 'PUT', body: values });
      toast({ variant: 'success', title: savedMessage(editing === 'new', r.deploy) });
      setEditing(null);
      onChanged();
      void refreshNav();
    } catch (err) {
      const fieldErrors = err instanceof ApiError ? err.fieldErrors : {};
      setErrors(fieldErrors);
      if (!Object.keys(fieldErrors).length) toast({ variant: 'error', title: errorMessage(err, 'No se pudo guardar.') });
    } finally {
      setSaving(false);
    }
  }

  /** Cambio rápido de estado desde la lista (pendiente → confirmado…), sin abrir el formulario. */
  const setStatus = React.useCallback(
    async (row: RecordRow, estado: string) => {
      try {
        const body = { ...initialValues(mod.fields, row), estado };
        await api(rowPath(mod.module_key, row.__id), { method: 'PUT', body });
        const label = mod.fields.find((f) => f.key === 'estado')?.options?.find((o) => o.value === estado)?.label ?? estado;
        toast({ variant: 'success', title: `#${String(row.__id)}: ${label}` });
        onChanged();
        void refreshNav();
      } catch (err) {
        toast({ variant: 'error', title: errorMessage(err, 'No se pudo cambiar el estado.') });
      }
    },
    [mod.fields, mod.module_key, onChanged, refreshNav, toast],
  );

  async function remove() {
    if (!deleting) return;
    try {
      const r = await api<SaveResult>(rowPath(mod.module_key, deleting.__id), { method: 'DELETE' });
      toast({ variant: 'success', title: r.deploy === 'ok' ? `Registro borrado. ${WEB_UPDATING}` : 'Registro borrado' });
      onChanged();
      void refreshNav();
    } catch (err) {
      toast({ variant: 'error', title: errorMessage(err, 'No se pudo borrar.') });
    }
    setDeleting(null);
  }

  return {
    editing,
    title: editing === 'new' ? `Nuevo registro · ${mod.name}` : `Editar registro #${editing ? String(editing.__id) : ''}`,
    values,
    errors,
    saving,
    deleting,
    open,
    close: () => setEditing(null),
    setValue,
    save,
    askDelete: setDeleting,
    cancelDelete: () => setDeleting(null),
    remove,
    setStatus,
  };
}
