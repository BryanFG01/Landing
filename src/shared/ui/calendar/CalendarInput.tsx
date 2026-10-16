'use client';

import { cn } from '@/shared/lib/utils';

import { Calendar } from './Calendar';
import { CalendarSVG } from './CalendarSVG';
import type { CalendarInputProps } from './types';
import { useCalendarInput } from './useCalendarInput';

// Input + popup listo para usar directamente
export function CalendarInput(props: Readonly<CalendarInputProps>) {
  const { value, placeholder, min, max, disabled, id, className, hasError } = props;
  const input = useCalendarInput(props);

  return (
    <div ref={input.ref} className={cn('relative', className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={input.open}
        onClick={input.toggle}
        className={cn(
          'flex h-9 w-full items-center gap-2 rounded-md border bg-background px-3 text-sm transition-colors',
          'focus:outline-none focus:ring-2',
          input.open && !hasError && 'border-primary ring-primary/30',
          hasError
            ? 'border-destructive focus:border-destructive focus:ring-destructive/30'
            : 'border-border focus:border-primary focus:ring-primary/30',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          input.display ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        <span className="flex-1 text-left">{input.display || (placeholder ?? 'dd/mm/aaaa')}</span>
        <CalendarSVG className="shrink-0 text-muted-foreground" />
      </button>

      {input.open && (
        <div className="absolute top-full left-0 z-50 mt-1.5">
          <Calendar
            value={value}
            onChange={input.handleChange}
            min={min}
            max={max}
            onClose={input.close}
          />
        </div>
      )}
    </div>
  );
}
