// Formulario genérico del editor de Sitio web: pinta cualquier sección a partir de su lista de campos (FieldDef de
// src/data/sitio.ts). Añadir un campo a un bloque no exige tocar este archivo.
// Cada tipo de campo está en su archivo (FieldInput, FieldGroup, ListField, ImageField, VideoField).
import * as React from 'react';
import { FieldGroup } from './FieldGroup';
import { FieldInput } from './FieldInput';
import type { FieldsProps } from './Fields.types';
import { isGroupField } from './lib/fields';

export function Fields({ fields, value, onChange }: Readonly<FieldsProps>) {
  return (
    <>
      {fields.map((f) =>
        isGroupField(f) ? (
          <FieldGroup key={f.key} def={f} value={value} onChange={onChange} />
        ) : (
          <FieldInput key={f.key} def={f} value={value[f.key]} onChange={(v) => onChange({ ...value, [f.key]: v })} />
        ),
      )}
    </>
  );
}
