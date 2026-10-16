// Campo de lista o de relación con otro módulo (una sola opción).
import * as React from 'react';
import { Select } from '@/shared/ui/select';
import { controlCommon, fromSelect, selectOptions, selectValue } from '../lib/recordForm';
import type { FieldControlProps } from './types';

export function SelectControl({ field, value, error, onChange, relationOptions }: Readonly<FieldControlProps>) {
  return (
    <Select
      {...controlCommon(field, error)}
      options={selectOptions(field, relationOptions)}
      value={selectValue(field, value)}
      placeholder={field.placeholder ?? 'Seleccionar...'}
      onValueChange={(v) => onChange(fromSelect(v))}
    />
  );
}
