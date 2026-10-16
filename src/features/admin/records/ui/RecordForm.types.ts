// Tipos de RecordForm.tsx.
import type { FieldConfig, Option } from '@/features/admin/core/domain/schema';
import type { FormValues } from './lib/recordForm';

export interface RecordFormProps {
  fields: FieldConfig[];
  values: FormValues;
  errors: Record<string, string>;
  onChange: (key: string, value: unknown) => void;
  relationOptions: Record<string, Option[]>;
}
