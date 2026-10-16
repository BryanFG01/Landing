// Tipos de ModuleEditor.tsx.
import type { ModuleGroup } from '@/features/admin/core/domain/schema';
import type { EditorModule } from './lib/moduleEditor';

export interface ModuleEditorProps {
  initial: EditorModule | null;
  recordCount: number;
  groups: ModuleGroup[];
  modules: EditorModule[];
}
