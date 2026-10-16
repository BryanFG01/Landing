// Elegir el tipo de origen del módulo (solo al crearlo).
import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { Icon } from '@/features/admin/core/ui/icons';
import { SOURCE_CHOICES } from '../lib/editorView';
import { SOURCE_HELP, SOURCE_ICON } from '../lib/moduleEditor';
import type { EditorProps } from '../types';

export function SourcePicker({ editor }: Readonly<EditorProps>) {
  const { mod, isNew } = editor;
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-3">
        {SOURCE_CHOICES.map(([value, label]) => {
          const selected = mod.source_type === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              disabled={!isNew && !selected}
              onClick={() => editor.switchSource(value)}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                selected ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted',
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Icon name={SOURCE_ICON[value]} />
                {label}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">{SOURCE_HELP[value]}</span>
            </button>
          );
        })}
      </div>
      {!isNew && <p className="text-xs text-muted-foreground">El tipo de origen no se cambia en un módulo ya creado.</p>}
    </>
  );
}
