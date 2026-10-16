// Selector de color con su valor hexadecimal editable. Si es opcional, se puede dejar vacío ("el del tema").
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import type { ColorFieldProps } from './ColorField.types';

/** Color que muestra el selector nativo cuando el campo está vacío (no admite "sin color"). */
const PICKER_EMPTY = '#888888';

export function ColorField({ label, value, onChange, help, optional, emptyLabel = 'Usa el del tema' }: Readonly<ColorFieldProps>) {
  const empty = optional && !value;
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || PICKER_EMPTY}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className={`h-9 w-12 cursor-pointer rounded-md border border-border bg-background p-1 ${empty ? 'opacity-40' : ''}`}
        />
        <div className="flex-1">
          <Input
            value={value}
            placeholder={optional ? emptyLabel : undefined}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${label} (hex)`}
          />
        </div>
        {optional && value && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange('')}>
            Quitar
          </Button>
        )}
      </div>
      {help && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}
