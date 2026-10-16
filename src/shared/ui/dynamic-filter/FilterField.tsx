import { BooleanField } from './BooleanField';
import { DateField } from './DateField';
import { DateRangeField } from './DateRangeField';
import { MultiSelectField } from './MultiSelectField';
import { NumberField } from './NumberField';
import { SelectField } from './SelectField';
import { TextField } from './TextField';
import type { DateRangeValue, FieldProps, FilterValue } from './types';

/** Elige el campo según el tipo del filtro y le pasa el valor con su tipo concreto. */
export function FilterField({ filter, value, onChange }: Readonly<FieldProps<FilterValue>>) {
  switch (filter.type) {
    case 'text':
      return <TextField filter={filter} value={value as string | undefined} onChange={onChange} />;
    case 'number':
      return <NumberField filter={filter} value={value as string | undefined} onChange={onChange} />;
    case 'select':
      return <SelectField filter={filter} value={value as string | undefined} onChange={onChange} />;
    case 'multiselect':
      return <MultiSelectField filter={filter} value={value as string[] | undefined} onChange={onChange} />;
    case 'date':
      return <DateField filter={filter} value={value as string | undefined} onChange={onChange} />;
    case 'daterange':
      return <DateRangeField filter={filter} value={value as DateRangeValue | undefined} onChange={onChange} />;
    case 'boolean':
      return <BooleanField filter={filter} value={value as boolean | undefined} onChange={onChange} />;
    default:
      return null;
  }
}
