// Tipos de RelationEditor.tsx.
import type { FieldConfig } from '@/features/admin/core/domain/schema';
import type { EditorModule } from '../lib/moduleEditor';

export interface RelationEditorProps {
  field: FieldConfig;
  modules: EditorModule[];
  onChange: (f: FieldConfig) => void;
}
