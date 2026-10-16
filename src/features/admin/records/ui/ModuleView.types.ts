// Tipos de ModuleView.tsx (los de sus piezas están en module-view/types.ts).
import type { ModuleAccess } from '@/features/admin/core/domain/schema';
import type { ViewModule } from './lib/moduleView';

export interface ModuleViewProps {
  module: ViewModule;
  access: ModuleAccess;
  canConfigure: boolean;
}
