// Constructor de módulos: lo que aquí se guarda es la fila de admin.modules que define el módulo entero (menú,
// formulario, tabla y filtros). La lógica está en hooks/useModuleEditor.ts, hooks/useModuleDraft.ts y
// lib/moduleEditor.ts; las pestañas, en module-editor/.
import * as React from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import type { ModuleGroup } from '../schema';
import { ConfirmDialog } from './ConfirmDialog';
import { ErrorList } from './ErrorList';
import { useModuleEditor } from './hooks/useModuleEditor';
import { Icon } from './icons';
import { deleteNotice, type EditorModule } from './lib/moduleEditor';
import { GeneralCard } from './module-editor/GeneralCard';
import { SourceCard } from './module-editor/SourceCard';
import { ColumnsTab, FieldsTab, FiltersTab } from './module-editor/Tabs';
import { PageHeader } from './PageHeader';

interface ModuleEditorProps {
  initial: EditorModule | null;
  recordCount: number;
  groups: ModuleGroup[];
  modules: EditorModule[];
}

export function ModuleEditor({ initial, recordCount, groups, modules }: Readonly<ModuleEditorProps>) {
  const editor = useModuleEditor({ initial, modules });
  const { mod, isNew } = editor;
  const notice = deleteNotice(mod.source_type, recordCount);
  const saveLabel = isNew ? 'Crear módulo' : 'Guardar cambios';

  return (
    <>
      <PageHeader
        title={isNew ? 'Nuevo módulo' : `Configurar · ${initial!.name}`}
        description="Lo que configures aquí define el módulo completo: su entrada en el menú, el formulario, la tabla y los filtros."
        icon="wrench"
        actions={
          <>
            {!isNew && (
              <Button variant="outline" onClick={editor.viewModule}>
                Ver módulo
              </Button>
            )}
            <Button onClick={editor.save} disabled={editor.saving}>
              {editor.saving ? 'Guardando…' : saveLabel}
            </Button>
          </>
        }
      />

      <ErrorList title="Revisa la configuración" errors={editor.errors} />

      <Tabs defaultValue="general">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          {mod.source_type !== 'query' && <TabsTrigger value="campos">Campos ({mod.fields.length})</TabsTrigger>}
          <TabsTrigger value="tabla">Tabla ({mod.column_configs.length})</TabsTrigger>
          <TabsTrigger value="filtros">Filtros ({mod.filters.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <SourceCard editor={editor} />
          <GeneralCard editor={editor} groups={groups} />
        </TabsContent>
        <TabsContent value="campos" className="space-y-3">
          <FieldsTab editor={editor} />
        </TabsContent>
        <TabsContent value="tabla" className="space-y-3">
          <ColumnsTab editor={editor} />
        </TabsContent>
        <TabsContent value="filtros" className="space-y-3">
          <FiltersTab editor={editor} />
        </TabsContent>
      </Tabs>

      {!isNew && (
        <Card className="mt-8 border-destructive/30 p-5">
          <h2 className="font-semibold">Borrar módulo</h2>
          <p className="mt-1 text-sm text-muted-foreground">{notice.card}</p>
          <Button variant="destructive" className="mt-4" onClick={editor.askDelete}>
            <Icon name="trash" /> Borrar módulo
          </Button>
        </Card>
      )}

      <ConfirmDialog
        open={editor.confirmingDelete}
        title={`¿Borrar "${initial?.name}"?`}
        description={notice.confirm}
        confirmLabel="Borrar todo"
        destructive
        onConfirm={editor.remove}
        onCancel={editor.cancelDelete}
      />
    </>
  );
}
