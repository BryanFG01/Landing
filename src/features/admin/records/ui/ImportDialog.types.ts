// Tipos de ImportDialog.tsx.
import type { FieldConfig } from '@/features/admin/core/domain/schema';

export interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleKey: string;
  moduleName: string;
  fields: FieldConfig[];
  onImported: () => void;
}
