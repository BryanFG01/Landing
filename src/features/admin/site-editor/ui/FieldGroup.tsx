// Grupo de campos del editor de Sitio web: un fieldset con título cuyos campos se guardan en el mismo objeto.
import * as React from 'react';
import { Fields } from './Fields';
import type { FieldGroupProps } from './Fields.types';

export function FieldGroup({ def, value, onChange }: Readonly<FieldGroupProps>) {
  return (
    <fieldset className="space-y-4 border-t border-border pt-4">
      <legend className="pr-2 text-sm font-semibold">{def.label}</legend>
      {def.help && <p className="-mt-2 text-xs text-muted-foreground">{def.help}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Fields fields={def.fields} value={value} onChange={onChange} />
      </div>
    </fieldset>
  );
}
