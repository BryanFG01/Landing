import type { RefObject } from 'react';

export interface CalendarIconProps {
  className?: string;
}

export interface CalendarProps {
  value?: string; // "yyyy-mm-dd"
  onChange: (date: string | undefined) => void;
  min?: string;
  max?: string;
  onClose?: () => void;
}

export interface CalendarInputProps {
  value?: string;
  onChange: (v: string | undefined) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  hasError?: boolean;
}

/** Una casilla de la cuadrícula de 6 semanas (incluye días del mes anterior y siguiente). */
export interface CalendarCell {
  iso: string;
  current: boolean;
  day: number;
}

/** Casilla lista para pintar: con su estado de selección, hoy y deshabilitado. */
export interface CalendarDayCell extends CalendarCell {
  selected: boolean;
  isToday: boolean;
  off: boolean;
}

export interface UseCalendarResult {
  today: string;
  year: number;
  monthLabel: string;
  yearMode: boolean;
  yearRange: number[];
  cells: CalendarDayCell[];
  prev: () => void;
  next: () => void;
  toggleYearMode: () => void;
  pickYear: (year: number) => void;
  select: (iso: string) => void;
  clear: () => void;
}

export interface UseCalendarInputResult {
  ref: RefObject<HTMLDivElement | null>;
  open: boolean;
  display: string;
  toggle: () => void;
  close: () => void;
  handleChange: (v: string | undefined) => void;
}
