import { cn } from '@/shared/lib/utils';

import { ChevronIcon } from './ChevronIcon';
import { inputCls } from './lib';
import type { FieldProps } from './types';
import { useMultiSelectField } from './useMultiSelectField';

export function MultiSelectField(props: Readonly<FieldProps<string[]>>) {
  const { filter } = props;
  const field = useMultiSelectField(props);

  return (
    <div ref={field.ref} className="relative">
      <button
        type="button"
        onClick={field.toggle}
        className={cn(
          inputCls,
          'flex items-center justify-between cursor-pointer',
          field.open && 'border-primary ring-1 ring-ring',
          field.isEmpty && 'text-muted-foreground'
        )}
      >
        <span className="truncate">{field.triggerLabel}</span>
        <ChevronIcon open={field.open} />
      </button>

      {field.open && (
        <div className="absolute top-full left-0 z-50 mt-1 min-w-full rounded-md border border-border bg-background shadow-lg py-1 max-h-52 overflow-y-auto">
          {filter.options?.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted text-foreground select-none"
            >
              <input
                type="checkbox"
                checked={field.isChecked(opt.value)}
                onChange={() => field.toggleOption(opt.value)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              {opt.label}
            </label>
          ))}
          {!field.hasOptions && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Sin opciones</p>
          )}
        </div>
      )}
    </div>
  );
}
