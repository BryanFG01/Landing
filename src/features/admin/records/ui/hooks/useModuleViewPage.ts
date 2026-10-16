// Pantalla de un módulo: junta las filas (useModuleRows), el formulario (useRecordEditor) y lo que decide la vista
// (permisos, columnas, textos y el diálogo de importar), para que ModuleView solo reparta a sus piezas.
import * as React from 'react';
import type { ModuleAccess } from '@/features/admin/core/domain/schema';
import { useRouter } from '@/features/admin/core/ui/router';
import { canEditModule, listSummary, moduleBadge, tableColumns, type ViewModule } from '../lib/moduleView';
import { useModuleRows } from './useModuleRows';
import { useRecordEditor } from './useRecordEditor';

export function useModuleViewPage(mod: ViewModule, access: ModuleAccess) {
  const { navigate } = useRouter();
  const rows = useModuleRows(mod);
  const editor = useRecordEditor(mod, rows.reload);
  const [importing, setImporting] = React.useState(false);
  const canEdit = canEditModule(mod, access);
  const columns = React.useMemo(() => tableColumns(mod.column_configs, rows.fields, canEdit), [mod.column_configs, rows.fields, canEdit]);

  function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    void editor.save();
  }

  return {
    rows,
    editor,
    canEdit,
    columns,
    badge: moduleBadge(mod, access),
    summary: listSummary(rows),
    emptyText: rows.hasFilters ? 'Ningún registro coincide con los filtros.' : 'Aún no hay registros.',
    configure: () => navigate(`/admin/modulos/${mod.id}`),
    importing,
    setImporting,
    openImport: () => setImporting(true),
    isEditing: editor.editing !== null,
    isDeleting: editor.deleting !== null,
    /** Cerrar el formulario desde el propio modal (Escape, clic fuera o la X). */
    onModalOpenChange: (open: boolean) => !open && editor.close(),
    submit,
  };
}

export type ModuleViewPage = ReturnType<typeof useModuleViewPage>;
