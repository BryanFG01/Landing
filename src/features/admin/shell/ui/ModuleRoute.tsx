// Ruta de un módulo: carga su definición y permisos antes de pintar sus registros.
import * as React from 'react';
import type { ModuleAccess } from '@/features/admin/core/domain/schema';
import { useApiData } from '@/features/admin/core/ui/hooks/useApiData';
import type { Mod } from '@/features/admin/core/ui/lib/modules';
import { isAdminUser } from '@/features/admin/core/ui/lib/roles';
import { LoadError, PageSkeleton } from '@/features/admin/core/ui/PageStates';
import { ModuleView } from '@/features/admin/records/ui/ModuleView';
import type { ModuleRouteProps } from './AdminApp.types';

export function ModuleRoute({ moduleKey, user }: Readonly<ModuleRouteProps>) {
  const { data, error, reload } = useApiData<{ module: Mod; access: ModuleAccess }>(`/m/${moduleKey}/definition`);
  if (error) return <LoadError message={error} onRetry={reload} />;
  // Mientras llega la definición del módulo nuevo no se pinta la del anterior.
  if (data?.module.module_key !== moduleKey) return <PageSkeleton />;
  return <ModuleView key={moduleKey} module={data.module} access={data.access} canConfigure={isAdminUser(user)} />;
}
