import { useEffect, useRef, useState } from 'react';

import { toDisplayDate } from './lib';
import type { CalendarInputProps, UseCalendarInputResult } from './types';

/** Abre y cierra el calendario emergente; se cierra al hacer clic fuera o al elegir una fecha. */
export function useCalendarInput({ value, onChange, disabled }: CalendarInputProps): UseCalendarInputResult {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  function toggle() {
    if (!disabled) setOpen((p) => !p);
  }

  function handleChange(v: string | undefined) {
    onChange(v);
    if (v) setOpen(false);
  }

  return {
    ref,
    open,
    display: toDisplayDate(value),
    toggle,
    close: () => setOpen(false),
    handleChange,
  };
}
