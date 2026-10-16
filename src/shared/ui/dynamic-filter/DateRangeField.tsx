import { CalendarInput } from '../calendar';
import { withRangeField } from './lib';
import type { DateRangeValue, FieldProps } from './types';

export function DateRangeField({ filter, value, onChange }: Readonly<FieldProps<DateRangeValue>>) {
  const from = value?.from;
  const to = value?.to;

  return (
    <div className="flex items-center gap-1.5">
      <CalendarInput
        value={from}
        onChange={(v) => onChange(withRangeField(value, 'from', v))}
        placeholder="Desde"
        max={to ?? (filter.max as string | undefined)}
        min={filter.min as string | undefined}
        className="flex-1 min-w-0"
      />
      <span className="shrink-0 text-xs text-muted-foreground">—</span>
      <CalendarInput
        value={to}
        onChange={(v) => onChange(withRangeField(value, 'to', v))}
        placeholder="Hasta"
        min={from ?? (filter.min as string | undefined)}
        max={filter.max as string | undefined}
        className="flex-1 min-w-0"
      />
    </div>
  );
}
