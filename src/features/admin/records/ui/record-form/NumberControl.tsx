// Campo de número o precio.
import * as React from 'react';
import { Input } from '@/shared/ui/input';
import { controlCommon, numberStep, textValue } from '../lib/recordForm';
import type { FieldControlProps } from './types';

export function NumberControl({ field, value, error, onChange }: Readonly<FieldControlProps>) {
  return (
    <Input
      {...controlCommon(field, error)}
      type="number"
      inputMode="decimal"
      step={numberStep(field)}
      min={field.min}
      max={field.max}
      value={textValue(value)}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
