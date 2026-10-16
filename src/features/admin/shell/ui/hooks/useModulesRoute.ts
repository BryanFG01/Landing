// Datos de la lista de módulos: módulos y grupos del menú, que se piden a la vez y se reintentan juntos.
import type { ModuleGroup } from '@/features/admin/core/domain/schema';
import { useApiData } from '@/features/admin/core/ui/hooks/useApiData';
import type { Mod } from '@/features/admin/core/ui/lib/modules';

export function useModulesRoute() {
  const modules = useApiData<{ modules: Mod[] }>('/modules');
  const groups = useApiData<{ groups: ModuleGroup[] }>('/groups');
  const retry = () => {
    modules.reload();
    groups.reload();
  };
  return {
    error: modules.error || groups.error,
    retry,
    modules: modules.data?.modules ?? null,
    groups: groups.data?.groups ?? null,
  };
}
