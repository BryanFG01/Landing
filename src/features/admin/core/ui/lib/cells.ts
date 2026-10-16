// Formateo de los valores de una celda según columnConfigs (sin React). CellValue.tsx solo pinta el resultado.
import type { FieldConfig, Option } from '../../domain/schema';
import { whatsappHref } from './format';

const dateFmt = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const numberFmt = new Intl.NumberFormat('es-CO');
const currencyFmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const MAX_TEXT = 80;

/** Una fecha sin hora (YYYY-MM-DD) se interpreta en local, no en UTC, para que no se corra un día. */
const parseDate = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00`) : new Date(v));

/** Etiqueta de un valor de lista o relación. */
export function optionLabel(value: unknown, options: Option[] | undefined) {
  return options?.find((o) => o.value === String(value))?.label ?? String(value);
}

/** Vacío para la tabla: null, undefined, texto vacío o lista sin elementos. */
export const isEmptyCell = (value: unknown) =>
  value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length);

/** Las relaciones toman sus opciones de la tabla relacionada; el resto, de las del propio campo. */
export const cellOptions = (field: FieldConfig | undefined, relationOptions: Option[] | undefined) =>
  field?.type === 'relation' ? relationOptions : field?.options;

export const formatNumberCell = (value: unknown) =>
  typeof value === 'number' ? numberFmt.format(value) : String(value);

export const formatCurrencyCell = (value: unknown) =>
  typeof value === 'number' ? currencyFmt.format(value) : String(value);

export const formatDateCell = (value: unknown) =>
  Number.isNaN(parseDate(String(value)).getTime()) ? String(value) : dateFmt.format(parseDate(String(value)));

export const formatDateTimeCell = (value: unknown) =>
  Number.isNaN(Date.parse(String(value))) ? String(value) : dateTimeFmt.format(new Date(String(value)));

/** Un valor suelto o una lista, siempre como lista para pintar una etiqueta por elemento. */
export const asList = (value: unknown): unknown[] => (Array.isArray(value) ? value : [value]);

/** Enlace de WhatsApp si el campo es un teléfono que lo parece; null en otro caso. */
export const phoneCellHref = (value: unknown, field: FieldConfig | undefined) =>
  field?.type === 'phone' ? whatsappHref(String(value)) : null;

/** Texto de una celda sin formato especial: objetos en JSON, opciones por su etiqueta y textos largos recortados. */
export function plainCellText(value: unknown, options: Option[] | undefined) {
  if (typeof value === 'object') return JSON.stringify(value);
  const text = options ? optionLabel(value, options) : String(value);
  return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT)}…` : text;
}
