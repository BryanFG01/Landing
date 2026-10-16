// Datos del editor de módulos: el módulo que se edita (si no es nuevo), los demás módulos y los grupos del menú.
import type { ModuleGroup } from '@/features/admin/core/domain/schema';
import { useApiData } from '@/features/admin/core/ui/hooks/useApiData';
import type { Mod } from '@/features/admin/core/ui/lib/modules';

export function useEditorRoute(id: number | null) {
  const current = useApiData<{ module: Mod; record_count: number }>(id ? `/modules/${id}` : null);
  const modules = useApiData<{ modules: Mod[] }>('/modules');
  const groups = useApiData<{ groups: ModuleGroup[] }>('/groups');
  // Mientras llega el módulo pedido no se pinta el anterior.
  const loading = Boolean((id && current.data?.module.id !== id) || !modules.data || !groups.data);
  return {
    error: current.error || modules.error || groups.error,
    loading,
    initial: id ? (current.data?.module ?? null) : null,
    recordCount: current.data?.record_count ?? 0,
    groups: groups.data?.groups ?? [],
    modules: modules.data?.modules ?? [],
  };
}
