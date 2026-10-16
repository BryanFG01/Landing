// Campo de texto corto (texto, email, URL, teléfono): el tipo del input sale del tipo del campo.
import * as React from 'react';
import { Input } from '@/shared/ui/input';
import { controlCommon, inputType, textValue } from '../lib/recordForm';
import type { FieldControlProps } from './types';

export function TextControl({ field, value, error, onChange }: Readonly<FieldControlProps>) {
  return (
    <Input
      {...controlCommon(field, error)}
      type={inputType(field)}
      value={textValue(value)}
      maxLength={field.max_length}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
