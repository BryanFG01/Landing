import type { CheckboxMarks, CheckState, SelectGroup, SelectOption } from './types';

/**
 * Valor por defecto de MultiSelect. Tiene que ser siempre el mismo array: con `= []` en las props se crea uno nuevo en
 * cada render y el efecto de useMultiSelect (modo no controlado) reinicia la selección en bucle.
 */
export const NO_SELECTION: string[] = [];

/** Sin grupos, todas las opciones forman un único grupo sin título. */
export function toGroups(groups: SelectGroup[], options: SelectOption[]): SelectGroup[] {
  return groups.length ? groups : [{ options }];
}

export function checkboxMarks(state: CheckState): CheckboxMarks {
  return {
    isActive: state !== false,
    isIndeterminate: state === 'indeterminate',
    isChecked: state === true,
  };
}

/** Texto del disparador: el marcador, la única opción elegida o cuántas hay. */
export function multiSelectLabel(selectedLabels: string[], placeholder: string): string {
  if (selectedLabels.length === 0) return placeholder;
  if (selectedLabels.length === 1) return selectedLabels[0];
  return `${selectedLabels.length} seleccionados`;
}
