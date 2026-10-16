// Lista del constructor: filas de la tabla de módulos y navegación a abrir, configurar o crear uno.
import * as React from 'react';
import type { ModuleGroup } from '@/features/admin/core/domain/schema';
import { moduleRows, type Mod, type ModuleRow } from '@/features/admin/core/ui/lib/modules';
import { useRouter } from '@/features/admin/core/ui/router';

export function useModulesList(modules: Mod[], groups: ModuleGroup[]) {
  const { navigate } = useRouter();
  return {
    rows: React.useMemo(() => moduleRows(modules, groups), [modules, groups]),
    create: () => navigate('/admin/modulos/nuevo'),
    open: (row: ModuleRow) => navigate(`/admin/m/${row.module_key}`),
    configure: (row: ModuleRow) => navigate(`/admin/modulos/${row.id}`),
  };
}
