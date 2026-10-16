// Ruta del editor de módulos (nuevo o existente): carga lo necesario antes de pintar ModuleEditor.
import * as React from 'react';
import { LoadError, PageSkeleton } from '@/features/admin/core/ui/PageStates';
import { ModuleEditor } from '@/features/admin/module-editor/ui/ModuleEditor';
import type { EditorRouteProps } from './AdminApp.types';
import { useEditorRoute } from './hooks/useEditorRoute';

export function EditorRoute({ id }: Readonly<EditorRouteProps>) {
  const editor = useEditorRoute(id);
  if (editor.error) return <LoadError message={editor.error} />;
  if (editor.loading) return <PageSkeleton />;
  return (
    <ModuleEditor
      key={id ?? 'nuevo'}
      initial={editor.initial}
      recordCount={editor.recordCount}
      groups={editor.groups}
      modules={editor.modules}
    />
  );
}
