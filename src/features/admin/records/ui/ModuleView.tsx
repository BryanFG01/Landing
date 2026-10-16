// Vista genérica de un módulo: filtros, tabla, orden, paginación y formulario de alta/edición. No sabe nada de ningún
// módulo en concreto: todo sale de su definición. La lógica está en hooks/useModuleViewPage.ts (que junta
// useModuleRows y useRecordEditor) y lib/moduleView.ts; las piezas, en module-view/.
import * as React from 'react';
import { Alert } from '@/shared/ui/alert';
import { DynamicFilter } from '@/shared/ui/dynamic-filter';
import { ConfirmDialog } from '@/features/admin/core/ui/ConfirmDialog';
import { PageHeader } from '@/features/admin/core/ui/PageHeader';
import { useModuleViewPage } from './hooks/useModuleViewPage';
import { ImportDialog } from './ImportDialog';
import { ModuleViewActions } from './module-view/ModuleViewActions';
import { RecordModal } from './module-view/RecordModal';
import { RecordsTable } from './module-view/RecordsTable';
import type { ModuleViewProps } from './ModuleView.types';

export function ModuleView({ module: mod, access, canConfigure }: Readonly<ModuleViewProps>) {
  const page = useModuleViewPage(mod, access);
  const { rows, editor } = page;

  return (
    <>
      <PageHeader
        title={mod.name}
        description={mod.description}
        icon={mod.icon}
        badge={page.badge}
        actions={<ModuleViewActions page={page} canConfigure={canConfigure} />}
      />

      {rows.uiFilters.length > 0 && (
        <DynamicFilter filters={rows.uiFilters} value={rows.filters} onChange={rows.setFilters} className="mb-4" />
      )}

      {rows.error && (
        <Alert variant="error" title="Error" className="mb-4">
          {rows.error}
        </Alert>
      )}

      <RecordsTable page={page} />

      <RecordModal page={page} fields={mod.fields} />

      {page.canEdit && (
        <ImportDialog
          open={page.importing}
          onOpenChange={page.setImporting}
          moduleKey={mod.module_key}
          moduleName={mod.name}
          fields={mod.fields}
          onImported={rows.reload}
        />
      )}

      <ConfirmDialog
        open={page.isDeleting}
        title="¿Borrar este registro?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Borrar"
        destructive
        onConfirm={editor.remove}
        onCancel={editor.cancelDelete}
      />
    </>
  );
}
