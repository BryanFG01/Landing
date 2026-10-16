// Tipos de ColumnRow.tsx.
import type { ColumnConfig } from '@/features/admin/core/domain/schema';
import type { ModuleEditorState } from '../hooks/useModuleEditor';

export interface ColumnRowProps {
  editor: ModuleEditorState;
  column: ColumnConfig;
  index: number;
}
