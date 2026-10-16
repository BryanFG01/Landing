// Valor que solo se actualiza cuando deja de cambiar durante `ms` (filtros mientras se escribe).
import * as React from 'react';

export function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
