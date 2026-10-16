// Formulario de un registro, generado a partir de los campos del módulo. Solo pinta: los valores iniciales y las
// reglas de cada control están en lib/recordForm.ts, y el control de cada tipo de campo, en record-form/.
import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { isWide } from './lib/recordForm';
import { FieldControl } from './record-form/FieldControl';
import type { RecordFormProps } from './RecordForm.types';

export function RecordForm({ fields, values, errors, onChange, relationOptions }: Readonly<RecordFormProps>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => (
        <div key={f.key} className={cn(isWide(f) && 'sm:col-span-2')}>
          <FieldControl
            field={f}
            value={values[f.key]}
            error={errors[f.key]}
            onChange={(v) => onChange(f.key, v)}
            relationOptions={relationOptions[f.key]}
          />
        </div>
      ))}
    </div>
  );
}
