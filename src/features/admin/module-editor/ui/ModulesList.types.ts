// Tipos de ModulesList.tsx.
import type { ModuleGroup } from '@/features/admin/core/domain/schema';
import type { Mod } from '@/features/admin/core/ui/lib/modules';

export interface ModulesListProps {
  modules: Mod[];
  groups: ModuleGroup[];
}
