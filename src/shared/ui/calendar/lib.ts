import type { CalendarCell } from './types';

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
export const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

// 6 semanas completas: la cuadrícula no cambia de alto entre meses
const GRID_SLOTS = 42;
const YEAR_RANGE_SIZE = 20;
const YEAR_RANGE_BEFORE = 10;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function buildGrid(year: number, month: number): CalendarCell[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: CalendarCell[] = [];

  // Cola del mes anterior
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    const [y, m] = month === 0 ? [year - 1, 11] : [year, month - 1];
    cells.push({ iso: toIso(y, m, d), current: false, day: d });
  }
  // Mes actual
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: toIso(year, month, d), current: true, day: d });
  }
  // Inicio del mes siguiente hasta completar las casillas
  const [ny, nm] = month === 11 ? [year + 1, 0] : [year, month + 1];
  for (let d = 1; cells.length < GRID_SLOTS; d++) {
    cells.push({ iso: toIso(ny, nm, d), current: false, day: d });
  }
  return cells;
}

/** Años que se ofrecen en el selector: diez antes del actual y nueve después. */
export function buildYearRange(): number[] {
  return Array.from({ length: YEAR_RANGE_SIZE }, (_, i) => new Date().getFullYear() - YEAR_RANGE_BEFORE + i);
}

export function isOutOfRange(iso: string, min?: string, max?: string): boolean {
  if (min && iso < min) return true;
  if (max && iso > max) return true;
  return false;
}

/** yyyy-mm-dd → dd/mm/yyyy */
export function toDisplayDate(value?: string): string {
  return value ? `${value.slice(8)}/${value.slice(5, 7)}/${value.slice(0, 4)}` : '';
}
