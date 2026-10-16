// Opciones de un campo de lista escritas como texto (una por línea).
import * as React from 'react';
import type { FieldConfig } from '@/features/admin/core/domain/schema';
import { optionsToText, textToOptions } from '../lib/moduleEditor';

export function useOptionsEditor(field: FieldConfig, onChange: (f: FieldConfig) => void) {
  // Texto tal cual se escribe (las líneas a medias no se pierden al convertir a opciones).
  const [text, setText] = React.useState(() => optionsToText(field.options));

  function edit(value: string) {
    setText(value);
    onChange({ ...field, options: textToOptions(value) });
  }

  return { text, edit };
}
