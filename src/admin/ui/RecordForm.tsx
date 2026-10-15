// Formulario de un registro, generado a partir de los campos del módulo.
import * as React from 'react';
import { DatePicker } from '../../components/ui/date-picker';
import { Input } from '../../components/ui/input';
import { MultiSelect, Select } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { cn } from '../../components/lib/utils';
import type { FieldConfig, Option } from '../schema';

export type FormValues = Record<string, unknown>;

/** Valor inicial de cada campo: el del registro o vacío. */
export function initialValues(fields: FieldConfig[], record?: Record<string, unknown> | null): FormValues {
  const out: FormValues = {};
  for (const f of fields) {
    const v = record?.[f.key];
    if (f.type === 'boolean') out[f.key] = v === true;
    else if (f.type === 'multiselect') out[f.key] = Array.isArray(v) ? v.map(String) : [];
    else if (v === undefined || v === null) out[f.key] = '';
    else out[f.key] = typeof v === 'number' ? String(v) : v;
  }
  return out;
}

const NONE = '__none__';

const requiredLabel = (f: FieldConfig) => (f.required ? `${f.label} *` : f.label);

function FieldControl({
  field,
  value,
  error,
  onChange,
  relationOptions,
}: {
  field: FieldConfig;
  value: unknown;
  error?: string;
  onChange: (v: unknown) => void;
  relationOptions?: Option[];
}) {
  const common = { label: requiredLabel(field), errorMessage: error, helperText: field.help };

  switch (field.type) {
    case 'textarea':
      return (
        <Textarea
          {...common}
          rows={4}
          value={String(value ?? '')}
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
          value={String(value ?? '')}
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
          value={value ? String(value) : undefined}
          onChange={(v) => onChange(v ?? '')}
        />
      );

    case 'boolean':
      return (
        <div className="flex h-full flex-col justify-end pb-1.5">
          <Switch
            label={field.label}
            description={error ?? field.help}
            checked={value === true}
            onCheckedChange={(v) => onChange(v)}
          />
        </div>
      );

    case 'select':
    case 'relation': {
      const options = (field.type === 'relation' ? relationOptions : field.options) ?? [];
      return (
        <Select
          {...common}
          // Radix Select no admite valor vacío: "Ninguno" se representa con un valor especial.
          options={field.required ? options : [{ value: NONE, label: '— Ninguno —' }, ...options]}
          value={value ? String(value) : field.required ? undefined : NONE}
          placeholder={field.placeholder ?? 'Seleccionar...'}
          onValueChange={(v) => onChange(v === NONE ? '' : v)}
        />
      );
    }

    case 'multiselect':
      return (
        <MultiSelect
          {...common}
          options={field.options ?? []}
          value={Array.isArray(value) ? (value as string[]) : []}
          placeholder={field.placeholder ?? 'Seleccionar...'}
          onValueChange={(v) => onChange(v)}
        />
      );

    default:
      return (
        <Input
          {...common}
          type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : field.type === 'phone' ? 'tel' : 'text'}
          value={String(value ?? '')}
          maxLength={field.max_length}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

export function RecordForm({
  fields,
  values,
  errors,
  onChange,
  relationOptions,
}: {
  fields: FieldConfig[];
  values: FormValues;
  errors: Record<string, string>;
  onChange: (key: string, value: unknown) => void;
  relationOptions: Record<string, Option[]>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => (
        <div key={f.key} className={cn(f.type === 'textarea' && 'sm:col-span-2')}>
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
