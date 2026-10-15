// Selector de color con su valor hexadecimal editable.
import * as React from 'react';
import { Input } from '../../components/ui/input';

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
}

export function ColorField({ label, value, onChange, help }: Readonly<ColorFieldProps>) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="h-9 w-12 cursor-pointer rounded-md border border-border bg-background p-1"
        />
        <div className="flex-1">
          <Input value={value} onChange={(e) => onChange(e.target.value)} aria-label={`${label} (hex)`} />
        </div>
      </div>
      {help && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}
