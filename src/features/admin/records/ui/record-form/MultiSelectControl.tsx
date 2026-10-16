// Campo de varias opciones.
import * as React from 'react';
import { MultiSelect } from '@/shared/ui/select';
import { controlCommon, multiValue } from '../lib/recordForm';
import type { FieldControlProps } from './types';

export function MultiSelectControl({ field, value, error, onChange }: Readonly<FieldControlProps>) {
  return (
    <MultiSelect
      {...controlCommon(field, error)}
      options={field.options ?? []}
      value={multiValue(value)}
      placeholder={field.placeholder ?? 'Seleccionar...'}
      onValueChange={onChange}
    />
  );
}
