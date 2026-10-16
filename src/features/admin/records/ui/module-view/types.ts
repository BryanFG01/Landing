// Tipos de las piezas de la vista de un módulo (module-view/).
import type { FieldConfig, Option, RecordRow } from '@/features/admin/core/domain/schema';
import type { ModuleViewPage } from '../hooks/useModuleViewPage';
import type { RecordColumn, SortState } from '../lib/moduleView';

export interface StatusCellProps {
  value: unknown;
  field: FieldConfig;
  onChange: (v: string) => void;
}

export interface SortControlProps {
  options: { value: string; label: string }[];
  sort: SortState;
  onField: (field: string) => void;
  onToggleDir: () => void;
}

export interface RecordCellProps {
  column: RecordColumn;
  value: unknown;
  row: RecordRow;
  relationOptions: Record<string, Option[]>;
  /** Cambio rápido de estado (módulos con "pendiente", como pedidos). */
  onStatus: (row: RecordRow, estado: string) => void;
}

export interface RowActionsProps {
  row: RecordRow;
  onEdit: (row: RecordRow) => void;
  onDelete: (row: RecordRow) => void;
}

/** Piezas que solo necesitan la pantalla ya preparada por useModuleViewPage. */
export interface PageProps {
  page: ModuleViewPage;
}

export interface ModuleViewActionsProps extends PageProps {
  canConfigure: boolean;
}

export interface RecordModalProps extends PageProps {
  fields: FieldConfig[];
}
