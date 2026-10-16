import type { DateRangeKey, DateRangeValue, FilterConfig, FilterType, FilterValues } from './types';

// ─── Clases ────────────────────────────────────────────────────────────────────

/** Clase base de los campos de texto, número y desplegables. */
export const inputCls = [
  'flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm',
  'text-foreground placeholder:text-muted-foreground',
  'outline-none transition-colors',
  'focus:border-primary focus:ring-1 focus:ring-ring',
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ');

// El rango de fechas necesita dos calendarios y el interruptor cabe en menos espacio
const FIELD_WIDTH: Partial<Record<FilterType, string>> = {
  daterange: 'min-w-[280px] flex-[2]',
  boolean: 'min-w-[160px] flex-1',
};
const DEFAULT_FIELD_WIDTH = 'min-w-[180px] flex-1';

export function fieldWidthClass(type: FilterType): string {
  return FIELD_WIDTH[type] ?? DEFAULT_FIELD_WIDTH;
}

// ─── Filtros activos ───────────────────────────────────────────────────────────

export function countActive(values: FilterValues): number {
  return Object.values(values).filter((v) => {
    if (v === undefined || v === '' || v === false) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return !!v.from || !!v.to;
    return true;
  }).length;
}

// ─── Número con rueda (donut) ──────────────────────────────────────────────────

export const DONUT_SIZE = 40;
export const DONUT_STROKE = 5;
export const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
export const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

/** El campo numérico se pinta como rueda solo si tiene mínimo y máximo. */
export function hasNumericRange(filter: FilterConfig): boolean {
  return filter.min !== undefined && filter.max !== undefined;
}

/** Fracción (0–1) del ángulo del puntero respecto al centro, empezando arriba y en sentido horario. */
export function angleToFraction(cx: number, cy: number, clientX: number, clientY: number): number {
  const dx = clientX - cx;
  const dy = clientY - cy;
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (deg < 0) deg += 360;
  return deg / 360;
}

export function clampFraction(value: number, min: number, max: number): number {
  return max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
}

/** Valor siguiente según la tecla pulsada; `undefined` si la tecla no mueve la rueda. */
export function stepFromKey(key: string, current: number, min: number, max: number): number | undefined {
  if (key === 'ArrowUp' || key === 'ArrowRight') return Math.min(max, current + 1);
  if (key === 'ArrowDown' || key === 'ArrowLeft') return Math.max(min, current - 1);
  if (key === 'Home') return min;
  if (key === 'End') return max;
  return undefined;
}

export function donutCaption(hasValue: boolean, displayValue: number, min: number, max: number): string {
  return hasValue ? `≥ ${displayValue}` : `Sin mínimo (${min}–${max})`;
}

// ─── Selección ─────────────────────────────────────────────────────────────────

export function optionLabel(filter: FilterConfig, value: string | undefined): string | undefined {
  return filter.options?.find((o) => o.value === value)?.label;
}

export function toggleInList(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter((v) => v !== item) : [...list, item];
}

export function multiSelectLabel(count: number, placeholder: string | undefined): string {
  if (count === 0) return placeholder ?? 'Seleccionar...';
  return `${count} seleccionado${count > 1 ? 's' : ''}`;
}

// ─── Rango de fechas ───────────────────────────────────────────────────────────

/** Cambia un extremo del rango; quita las claves vacías y devuelve `undefined` si no queda ninguna. */
export function withRangeField(
  value: DateRangeValue | undefined,
  field: DateRangeKey,
  val: string | undefined
): DateRangeValue | undefined {
  const next = { ...(value ?? {}), [field]: val };
  if (!next.from) delete next.from;
  if (!next.to) delete next.to;
  return Object.keys(next).length === 0 ? undefined : next;
}
