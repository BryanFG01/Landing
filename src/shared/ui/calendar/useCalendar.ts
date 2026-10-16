import { useState } from 'react';

import { buildGrid, buildYearRange, isOutOfRange, MONTHS, todayStr } from './lib';
import type { CalendarProps, UseCalendarResult } from './types';

/** Estado del calendario: mes y año visibles, modo selector de año y casillas listas para pintar. */
export function useCalendar({ value, onChange, min, max, onClose }: CalendarProps): UseCalendarResult {
  const today = todayStr();
  const seed = value ?? today;

  const [year, setYear] = useState(() => parseInt(seed.slice(0, 4)));
  const [month, setMonth] = useState(() => parseInt(seed.slice(5, 7)) - 1);
  const [yearMode, setYearMode] = useState(false);

  const cells = buildGrid(year, month).map((cell) => ({
    ...cell,
    selected: value === cell.iso,
    isToday: today === cell.iso,
    off: isOutOfRange(cell.iso, min, max),
  }));

  function prev() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  }

  function next() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  }

  function select(iso: string) {
    if (isOutOfRange(iso, min, max)) return;
    onChange(iso);
    onClose?.();
  }

  function clear() {
    onChange(undefined);
    onClose?.();
  }

  function pickYear(y: number) {
    setYear(y);
    setYearMode(false);
  }

  return {
    today,
    year,
    monthLabel: MONTHS[month],
    yearMode,
    yearRange: buildYearRange(),
    cells,
    prev,
    next,
    toggleYearMode: () => setYearMode((m) => !m),
    pickYear,
    select,
    clear,
  };
}
