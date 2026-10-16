// Tipos de FieldRow.tsx.
import type { ReactNode } from 'react';
import type { FieldConfig } from '@/features/admin/core/domain/schema';
import type { Choice, EditorModule } from './lib/moduleEditor';

export interface FieldRowProps {
  field: FieldConfig;
  index: number;
  /** La clave sigue a la etiqueta mientras no se toque a mano. */
  autoKey: boolean;
  modules: EditorModule[];
  /** Módulos de tabla: la clave es una columna de la tabla. */
  columnChoices?: Choice[];
  onChange: (field: FieldConfig, keyEdited?: boolean) => void;
  tools: ReactNode;
}
