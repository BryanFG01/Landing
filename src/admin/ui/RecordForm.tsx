// Formulario de un registro, generado a partir de los campos del módulo.
import * as React from 'react';
import { DatePicker } from '../../components/ui/date-picker';
import { Input } from '../../components/ui/input';
import { MultiSelect, Select } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { cn } from '../../components/lib/utils';
import { fileUrl, parseFileRef, type FieldConfig, type Option } from '../schema';
import { ApiError, uploadFile } from './api';
import { Icon } from './icons';

export type FormValues = Record<string, unknown>;

/** Valor inicial de cada campo: el del registro o vacío. */
export function initialValues(fields: FieldConfig[], record?: Record<string, unknown> | null): FormValues {
  const out: FormValues = {};
  for (const f of fields) {
    const v = record?.[f.key];
    if (f.type === 'boolean') out[f.key] = v === true;
    else if (f.type === 'multiselect') out[f.key] = Array.isArray(v) ? v.map(String) : [];
    else if (f.type === 'image' || f.type === 'file') out[f.key] = parseFileRef(v) ?? '';
    else if (v === undefined || v === null) out[f.key] = '';
    // Columnas de fecha y hora de las tablas: el formulario trabaja con el día.
    else if (f.type === 'date') out[f.key] = String(v).slice(0, 10);
    else out[f.key] = typeof v === 'number' ? String(v) : v;
  }
  return out;
}

const sizeFmt = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`);

/** Foto o archivo: se sube al elegirlo y el campo guarda su referencia. */
function FileControl({
  field,
  value,
  error,
  onChange,
}: {
  field: FieldConfig;
  value: unknown;
  error?: string;
  onChange: (v: unknown) => void;
}) {
  const ref = parseFileRef(value);
  const input = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState('');
  const isImage = field.type === 'image';

  async function pick(file: File | undefined) {
    if (!file) return;
    setUploadError('');
    if (file.size > 4 * 1024 * 1024) return setUploadError('El archivo pesa más de 4 MB.');
    setUploading(true);
    try {
      onChange(await uploadFile(file));
    } catch (e) {
      setUploadError(e instanceof ApiError ? e.message : 'No se pudo subir el archivo.');
    } finally {
      setUploading(false);
      if (input.current) input.current.value = '';
    }
  }

  const message = uploadError || error;
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{field.required ? `${field.label} *` : field.label}</p>
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-3">
        {ref && isImage ? (
          <img src={fileUrl(ref)} alt="" className="size-14 shrink-0 rounded-md object-cover" />
        ) : (
          <span className="grid size-14 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
            <Icon name={isImage ? 'image' : 'paperclip'} className="size-6" />
          </span>
        )}
        <div className="min-w-0 flex-1 text-sm">
          {ref ? (
            <>
              <a href={fileUrl(ref)} target="_blank" rel="noopener" className="block truncate font-medium hover:text-primary">
                {ref.name}
              </a>
              <span className="text-xs text-muted-foreground">{sizeFmt(ref.size)}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{uploading ? 'Subiendo…' : isImage ? 'Sin foto' : 'Sin archivo'}</span>
          )}
        </div>
        <input
          ref={input}
          type="file"
          className="sr-only"
          accept={isImage ? 'image/png,image/jpeg,image/webp,image/gif,image/avif' : undefined}
          onChange={(e) => pick(e.target.files?.[0])}
          aria-label={field.label}
        />
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => input.current?.click()}>
          <Icon name="upload" /> {ref ? 'Cambiar' : 'Subir'}
        </Button>
        {ref && (
          <Button type="button" variant="ghost" size="icon" aria-label="Quitar" onClick={() => onChange('')}>
            <Icon name="x" />
          </Button>
        )}
      </div>
      {message ? (
        <p className="mt-1 text-xs text-destructive">{message}</p>
      ) : (
        field.help && <p className="mt-1 text-xs text-muted-foreground">{field.help}</p>
      )}
    </div>
  );
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
        <div key={f.key} className={cn((f.type === 'textarea' || f.type === 'file' || f.type === 'image') && 'sm:col-span-2')}>
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
