// Campo de fecha (el formulario trabaja con el día, AAAA-MM-DD).
import * as React from 'react';
import { DatePicker } from '@/shared/ui/date-picker';
import { textValue } from '../lib/recordForm';
import type { FieldControlProps } from './types';

export function DateControl({ field, value, error, onChange }: Readonly<FieldControlProps>) {
  return (
    <DatePicker
      label={field.label}
      required={field.required}
      errorMessage={error}
      helperText={field.help}
      value={value ? textValue(value) : undefined}
      onChange={(v) => onChange(v ?? '')}
    />
  );
}
