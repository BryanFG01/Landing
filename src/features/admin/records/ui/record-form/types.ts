// Tipos compartidos por los controles del formulario de registros.
import type { FieldConfig, Option } from '@/features/admin/core/domain/schema';

export interface FieldControlProps {
  field: FieldConfig;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  relationOptions?: Option[];
}
