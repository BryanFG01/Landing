// Opciones de un campo de lista o de varias opciones.
import * as React from 'react';
import { Textarea } from '@/shared/ui/textarea';
import { useOptionsEditor } from '../hooks/useOptionsEditor';
import type { OptionsEditorProps } from './OptionsEditor.types';

export function OptionsEditor({ field, onChange }: Readonly<OptionsEditorProps>) {
  const options = useOptionsEditor(field, onChange);
  return (
    <div className="sm:col-span-2 lg:col-span-4">
      <Textarea
        label="Opciones"
        helperText='Una por línea. Escribe "valor | Etiqueta" para fijar el valor guardado.'
        rows={4}
        value={options.text}
        onChange={(e) => options.edit(e.target.value)}
      />
    </div>
  );
}
