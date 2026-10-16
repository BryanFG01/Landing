// Campo de texto largo.
import * as React from 'react';
import { Textarea } from '@/shared/ui/textarea';
import { controlCommon, textValue } from '../lib/recordForm';
import type { FieldControlProps } from './types';

export function TextareaControl({ field, value, error, onChange }: Readonly<FieldControlProps>) {
  return (
    <Textarea
      {...controlCommon(field, error)}
      rows={4}
      value={textValue(value)}
      maxLength={field.max_length}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
