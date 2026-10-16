import { useState } from 'react';

import { countActive } from './lib';
import type { FilterValue, FilterValues, UseDynamicFilterResult } from './types';

/** Panel de filtros: plegado/desplegado, cuántos hay activos y cambiar o limpiar valores. */
export function useDynamicFilter(
  value: FilterValues,
  onChange: ((values: FilterValues) => void) | undefined,
  defaultExpanded: boolean
): UseDynamicFilterResult {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const activeCount = countActive(value);

  return {
    expanded,
    activeCount,
    hasActive: activeCount > 0,
    toggleExpanded: () => setExpanded((p) => !p),
    handleChange: (key: string, fieldValue: FilterValue | undefined) => onChange?.({ ...value, [key]: fieldValue }),
    clearAll: () => onChange?.({}),
  };
}
