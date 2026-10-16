// Tipos de ModulesTable.tsx.
import type { ModuleRow } from '@/features/admin/core/ui/lib/modules';

export interface ModulesTableProps {
  rows: ModuleRow[];
  onOpen: (row: ModuleRow) => void;
  onConfigure: (row: ModuleRow) => void;
}
