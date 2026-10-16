import { cn } from '@/shared/lib/utils';

import { ChevronIcon } from './ChevronIcon';
import { inputCls } from './lib';
import type { FieldProps } from './types';
import { useSelectField } from './useSelectField';

export function SelectField(props: Readonly<FieldProps<string>>) {
  const { filter, value } = props;
  const field = useSelectField(props);

  return (
    <div ref={field.ref} className="relative">
      <button
        type="button"
        onClick={field.toggle}
        className={cn(
          inputCls,
          'flex items-center justify-between cursor-pointer',
          field.open && 'border-primary ring-1 ring-ring',
          !field.hasValue && 'text-muted-foreground'
        )}
      >
        <span className="truncate">{field.triggerLabel}</span>
        <ChevronIcon open={field.open} />
      </button>

      {field.open && (
        <div className="absolute top-full left-0 z-50 mt-1 min-w-full rounded-md border border-border bg-background shadow-lg py-1 max-h-52 overflow-y-auto">
          <button
            type="button"
            onClick={() => field.pick(undefined)}
            className={cn(
              'w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors',
              !field.hasValue ? 'font-semibold text-foreground' : 'text-muted-foreground'
            )}
          >
            {field.placeholderLabel}
          </button>
          {filter.options?.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => field.pick(opt.value)}
              className={cn(
                'w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors',
                value === opt.value
                  ? 'font-semibold text-primary bg-primary/5'
                  : 'text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
