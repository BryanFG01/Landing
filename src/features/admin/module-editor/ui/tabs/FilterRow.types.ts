// Tipos de FilterRow.tsx.
import type { FilterConfig } from '@/features/admin/core/domain/schema';
import type { ModuleEditorState } from '../hooks/useModuleEditor';

export interface FilterRowProps {
  editor: ModuleEditorState;
  filter: FilterConfig;
  index: number;
}
