// Formulario de un registro, generado a partir de los campos del módulo. Solo pinta: los valores iniciales y las
// reglas de cada control están en lib/recordForm.ts.
import * as React from 'react';
import { DatePicker } from '../../components/ui/date-picker';
import { Input } from '../../components/ui/input';
import { MultiSelect, Select } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { cn } from '../../components/lib/utils';
import type { FieldConfig, Option } from '../schema';
import { fromSelect, inputType, isWide, requiredLabel, selectOptions, selectValue, type FormValues } from './lib/recordForm';
import { FileControl } from './records/FileControl';

interface FieldControlProps {
  field: FieldConfig;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  relationOptions?: Option[];
}

function FieldControl({ field, value, error, onChange, relationOptions }: Readonly<FieldControlProps>) {
  const common = { label: requiredLabel(field), errorMessage: error, helperText: field.help };
  const text = String(value ?? '');

  switch (field.type) {
    case 'textarea':
      return (
        <Textarea
          {...common}
          rows={4}
          value={text}
          maxLength={field.max_length}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'number':
    case 'currency':
      return (
        <Input
          {...common}
          type="number"
          inputMode="decimal"
          step={field.type === 'currency' ? '1' : 'any'}
          min={field.min}
          max={field.max}
          value={text}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'date':
      return (
        <DatePicker
          label={field.label}
          required={field.required}
          errorMessage={error}
          helperText={field.help}
          value={value ? text : undefined}
          onChange={(v) => onChange(v ?? '')}
        />
      );

    case 'boolean':
      return (
        <div className="flex h-full flex-col justify-end pb-1.5">
          <Switch label={field.label} description={error ?? field.help} checked={value === true} onCheckedChange={onChange} />
        </div>
      );

    case 'select':
    case 'relation':
      return (
        <Select
          {...common}
          options={selectOptions(field, relationOptions)}
          value={selectValue(field, value)}
          placeholder={field.placeholder ?? 'Seleccionar...'}
          onValueChange={(v) => onChange(fromSelect(v))}
        />
      );

    case 'image':
    case 'file':
      return <FileControl field={field} value={value} error={error} onChange={onChange} />;

    case 'multiselect':
      return (
        <MultiSelect
          {...common}
          options={field.options ?? []}
          value={Array.isArray(value) ? (value as string[]) : []}
          placeholder={field.placeholder ?? 'Seleccionar...'}
          onValueChange={onChange}
        />
      );

    default:
      return (
        <Input
          {...common}
          type={inputType(field)}
          value={text}
          maxLength={field.max_length}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

interface RecordFormProps {
  fields: FieldConfig[];
  values: FormValues;
  errors: Record<string, string>;
  onChange: (key: string, value: unknown) => void;
  relationOptions: Record<string, Option[]>;
}

export function RecordForm({ fields, values, errors, onChange, relationOptions }: Readonly<RecordFormProps>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => (
        <div key={f.key} className={cn(isWide(f) && 'sm:col-span-2')}>
          <FieldControl
            field={f}
            value={values[f.key]}
            error={errors[f.key]}
            onChange={(v) => onChange(f.key, v)}
            relationOptions={relationOptions[f.key]}
          />
        </div>
      ))}
    </div>
  );
}
