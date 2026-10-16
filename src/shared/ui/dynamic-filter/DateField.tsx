import { CalendarInput } from '../calendar';
import type { FieldProps } from './types';

export function DateField({ filter, value, onChange }: Readonly<FieldProps<string>>) {
  return (
    <CalendarInput
      value={value}
      onChange={onChange}
      min={filter.min as string | undefined}
      max={filter.max as string | undefined}
    />
  );
}
