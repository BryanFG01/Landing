// Ruta de la lista de módulos: carga módulos y grupos antes de pintar ModulesList.
import * as React from 'react';
import { LoadError, PageSkeleton } from '@/features/admin/core/ui/PageStates';
import { ModulesList } from '@/features/admin/module-editor/ui/ModulesList';
import { useModulesRoute } from './hooks/useModulesRoute';

export function ModulesRoute() {
  const { error, retry, modules, groups } = useModulesRoute();
  if (error) return <LoadError message={error} onRetry={retry} />;
  if (!modules || !groups) return <PageSkeleton />;
  return <ModulesList modules={modules} groups={groups} />;
}
