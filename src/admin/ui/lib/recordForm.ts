// Formulario de registros: valores iniciales y ayudas para pintar cada campo (sin React).
import { parseFileRef, type FieldConfig, type Option } from '../../schema';

export type FormValues = Record<string, unknown>;

/** Valor inicial de cada campo: el del registro o vacío. */
export function initialValues(fields: FieldConfig[], record?: Record<string, unknown> | null): FormValues {
  return Object.fromEntries(fields.map((f) => [f.key, initialValue(f, record?.[f.key])]));
}

function initialValue(f: FieldConfig, v: unknown): unknown {
  if (f.type === 'boolean') return v === true;
  if (f.type === 'multiselect') return Array.isArray(v) ? v.map(String) : [];
  if (f.type === 'image' || f.type === 'file') return parseFileRef(v) ?? '';
  if (v === undefined || v === null) return '';
  // Columnas de fecha y hora de las tablas: el formulario trabaja con el día.
  if (f.type === 'date') return String(v).slice(0, 10);
  return typeof v === 'number' ? String(v) : v;
}

export const requiredLabel = (f: FieldConfig) => (f.required ? `${f.label} *` : f.label);

/** Radix Select no admite valor vacío: "Ninguno" se representa con un valor especial. */
export const NONE = '__none__';

/** Opciones de una lista o relación; si el campo no es obligatorio, con "Ninguno" al principio. */
export function selectOptions(f: FieldConfig, relationOptions: Option[] | undefined): Option[] {
  const options = (f.type === 'relation' ? relationOptions : f.options) ?? [];
  return f.required ? options : [{ value: NONE, label: '— Ninguno —' }, ...options];
}

export function selectValue(f: FieldConfig, value: unknown): string | undefined {
  if (value) return String(value);
  return f.required ? undefined : NONE;
}

export const fromSelect = (v: string) => (v === NONE ? '' : v);

export const inputType = (f: FieldConfig) =>
  ({ email: 'email', url: 'url', phone: 'tel' })[f.type as 'email' | 'url' | 'phone'] ?? 'text';

/** Campos que ocupan las dos columnas del formulario. */
export const isWide = (f: FieldConfig) => f.type === 'textarea' || f.type === 'file' || f.type === 'image';

export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/avif';

/** Límite de una subida (la función de Vercel no acepta cuerpos de más de 4,5 MB). */
export const FILE_MAX = 4 * 1024 * 1024;
