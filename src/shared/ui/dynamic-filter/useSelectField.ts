import { optionLabel } from './lib';
import type { FieldProps, UseSelectFieldResult } from './types';
import { useDropdown } from './useDropdown';

/** Desplegable de una opción: etiqueta del disparador y elegir (o volver a "Todos") cerrando el menú. */
export function useSelectField({ filter, value, onChange }: FieldProps<string>): UseSelectFieldResult {
  const dropdown = useDropdown();
  const placeholderLabel = filter.placeholder ?? 'Todos';

  function pick(optionValue: string | undefined) {
    onChange(optionValue);
    dropdown.close();
  }

  return {
    ...dropdown,
    triggerLabel: optionLabel(filter, value) ?? placeholderLabel,
    placeholderLabel,
    hasValue: !!value,
    pick,
  };
}
