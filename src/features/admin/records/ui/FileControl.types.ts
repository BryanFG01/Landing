// Tipos de FileControl.tsx.
import type { FieldConfig } from '@/features/admin/core/domain/schema';

export interface FileControlProps {
  field: FieldConfig;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}
