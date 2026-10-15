// Alta, edición y borrado de una fila de un módulo. `onChanged` recarga la lista tras guardar o borrar.
import * as React from 'react';
import { useToast } from '../../../components/ui/toast';
import type { RecordRow } from '../../schema';
import { api, ApiError, errorMessage } from '../api';
import { rowPath, type ViewModule } from '../lib/moduleView';
import { initialValues, type FormValues } from '../lib/recordForm';

export function useRecordEditor(mod: ViewModule, onChanged: () => void) {
  const { toast } = useToast();
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
      if (editing === 'new') await api(`/m/${mod.module_key}`, { method: 'POST', body: values });
      else await api(rowPath(mod.module_key, editing.__id), { method: 'PUT', body: values });
      toast({ variant: 'success', title: editing === 'new' ? 'Registro creado' : 'Cambios guardados' });
      setEditing(null);
      onChanged();
    } catch (err) {
      const fieldErrors = err instanceof ApiError ? err.fieldErrors : {};
      setErrors(fieldErrors);
      if (!Object.keys(fieldErrors).length) toast({ variant: 'error', title: errorMessage(err, 'No se pudo guardar.') });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    try {
      await api(rowPath(mod.module_key, deleting.__id), { method: 'DELETE' });
      toast({ variant: 'success', title: 'Registro borrado' });
      onChanged();
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
  };
}
