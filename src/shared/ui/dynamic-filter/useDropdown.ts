import { useEffect, useRef, useState } from 'react';

import type { UseDropdownResult } from './types';

/** Estado abierto/cerrado de un desplegable que se cierra al hacer clic fuera de `ref`. */
export function useDropdown(): UseDropdownResult {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return {
    ref,
    open,
    toggle: () => setOpen((p) => !p),
    close: () => setOpen(false),
  };
}
