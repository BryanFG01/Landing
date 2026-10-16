// Tipos de GeneralCard.tsx.
import type { ModuleGroup } from '@/features/admin/core/domain/schema';
import type { ModuleEditorState } from './hooks/useModuleEditor';

export interface GeneralCardProps {
  editor: ModuleEditorState;
  groups: ModuleGroup[];
}
