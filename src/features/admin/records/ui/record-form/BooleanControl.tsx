// Campo sí/no.
import * as React from 'react';
import { Switch } from '@/shared/ui/switch';
import type { FieldControlProps } from './types';

export function BooleanControl({ field, value, error, onChange }: Readonly<FieldControlProps>) {
  return (
    <div className="flex h-full flex-col justify-end pb-1.5">
      <Switch label={field.label} description={error ?? field.help} checked={value === true} onCheckedChange={onChange} />
    </div>
  );
}
