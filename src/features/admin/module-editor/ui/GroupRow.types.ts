// Tipos de GroupRow.tsx.
import type { ModuleGroup } from '@/features/admin/core/domain/schema';

export interface GroupRowProps {
  group: ModuleGroup;
  onSave: (patch: Partial<ModuleGroup>) => void;
  onDelete: () => void;
}
