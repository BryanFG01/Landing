// Tipos de OptionsEditor.tsx.
import type { FieldConfig } from '@/features/admin/core/domain/schema';

export interface OptionsEditorProps {
  field: FieldConfig;
  onChange: (f: FieldConfig) => void;
}
