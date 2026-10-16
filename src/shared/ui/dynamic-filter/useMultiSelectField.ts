import { multiSelectLabel, toggleInList } from './lib';
import type { FieldProps, UseMultiSelectFieldResult } from './types';
import { useDropdown } from './useDropdown';

/** Desplegable con casillas: alterna opciones y entrega `undefined` cuando no queda ninguna elegida. */
export function useMultiSelectField({ filter, value, onChange }: FieldProps<string[]>): UseMultiSelectFieldResult {
  const dropdown = useDropdown();
  const selected = value ?? [];

  function toggleOption(optValue: string) {
    const next = toggleInList(selected, optValue);
    onChange(next.length ? next : undefined);
  }

  return {
    ...dropdown,
    triggerLabel: multiSelectLabel(selected.length, filter.placeholder),
    isEmpty: selected.length === 0,
    hasOptions: !!filter.options?.length,
    isChecked: (optValue) => selected.includes(optValue),
    toggleOption,
  };
}
