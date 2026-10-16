import { cn } from '@/shared/lib/utils';

import type { FieldProps } from './types';

export function BooleanField({ filter, value, onChange }: Readonly<FieldProps<boolean>>) {
  const checked = !!value;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={filter.label}
      onClick={() => onChange(checked ? undefined : true)}
      className={cn(
        'relative inline-flex h-9 w-full items-center gap-3 rounded-md border px-3 text-sm transition-colors',
        checked
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/50'
      )}
    >
      <span
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors',
          checked ? 'bg-primary' : 'bg-muted'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </span>
      <span className="truncate">{filter.placeholder ?? filter.label}</span>
    </button>
  );
}
