// Tipos de ColorField.tsx.

export interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
  /** Permite dejarlo vacío; `emptyLabel` dice qué se usa entonces. */
  optional?: boolean;
  emptyLabel?: string;
}
