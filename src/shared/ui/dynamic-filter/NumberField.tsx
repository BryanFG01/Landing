import { cn } from '@/shared/lib/utils';

import { DonutNumberField } from './DonutNumberField';
import { hasNumericRange, inputCls } from './lib';
import type { FieldProps } from './types';

export function NumberField({ filter, value, onChange }: Readonly<FieldProps<string>>) {
  if (hasNumericRange(filter)) {
    return <DonutNumberField filter={filter} value={value} onChange={onChange} />;
  }

  return (
    <input
      type="number"
      value={value ?? ''}
      min={filter.min}
      max={filter.max}
      onChange={(e) => onChange(e.target.value || undefined)}
      placeholder={filter.placeholder ?? '0'}
      className={cn(
        inputCls,
        '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
      )}
    />
  );
}
