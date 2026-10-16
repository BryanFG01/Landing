// Selector del icono del módulo en el menú.
import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { ICONS } from '@/features/admin/core/domain/schema';
import { Icon } from '@/features/admin/core/ui/icons';
import type { IconPickerProps } from './IconPicker.types';

export function IconPicker({ value, onChange }: Readonly<IconPickerProps>) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">Icono</p>
      <div className="flex flex-wrap gap-2">
        {ICONS.map((name) => (
          <button
            key={name}
            type="button"
            aria-label={name}
            aria-pressed={value === name}
            onClick={() => onChange(name)}
            className={cn(
              'grid size-10 place-items-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              value === name ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon name={name} className="size-5" />
          </button>
        ))}
      </div>
    </div>
  );
}
