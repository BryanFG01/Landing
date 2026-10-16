import { useEffect, useState } from 'react';

import { multiSelectLabel } from './lib';
import type { CheckState, UseMultiSelectOptions, UseMultiSelectResult } from './types';

/** Selección múltiple controlada o no controlada, con "seleccionar todo" sobre las opciones habilitadas. */
export function useMultiSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
}: UseMultiSelectOptions): UseMultiSelectResult {
  const isControlled = value !== undefined;
  const [selectedValues, setSelectedValues] = useState<string[]>(defaultValue);
  const currentValues = isControlled ? value! : selectedValues;

  useEffect(() => {
    if (!isControlled) {
      setSelectedValues(defaultValue);
    }
  }, [defaultValue, isControlled]);

  const enabledValues = options.filter((opt) => !opt.disabled).map((opt) => opt.value);
  const allSelected = enabledValues.length > 0 && enabledValues.every((v) => currentValues.includes(v));
  const someSelected = currentValues.length > 0 && !allSelected;
  const selectAllState: CheckState = allSelected ? true : someSelected ? 'indeterminate' : false;

  const setValues = (next: string[]) => {
    if (!isControlled) {
      setSelectedValues(next);
    }
    onValueChange?.(next);
  };

  const toggleOption = (optionValue: string) => {
    const next = currentValues.includes(optionValue)
      ? currentValues.filter((v) => v !== optionValue)
      : [...currentValues, optionValue];
    setValues(next);
  };

  const selectedLabels = options.filter((opt) => currentValues.includes(opt.value)).map((opt) => opt.label);
  const displayLabel = multiSelectLabel(selectedLabels, placeholder);

  return {
    items: options.map((opt) => ({ ...opt, checked: currentValues.includes(opt.value) })),
    selectAllState,
    displayLabel,
    isPlaceholder: displayLabel === placeholder,
    toggleOption,
    toggleSelectAll: () => setValues(allSelected ? [] : enabledValues),
  };
}
