// Tipos de FilePicker.tsx.
import type * as React from 'react';

export interface FilePickerProps {
  /** Tipos aceptados, como en <input accept>. */
  accept?: string;
  /** Nombre accesible del selector. */
  label: string;
  children: React.ReactNode;
  onPick: (file: File) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  variant?: 'outline' | 'ghost';
}
