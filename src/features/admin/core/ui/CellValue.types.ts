// Tipos de CellValue.tsx.
import type { ColumnConfig, FieldConfig, Option } from '../domain/schema';

export interface CellValueProps {
  value: unknown;
  column: ColumnConfig;
  field: FieldConfig | undefined;
  relationOptions: Option[] | undefined;
}
