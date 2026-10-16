import type { KeyboardEvent, PointerEvent, RefObject } from 'react';

export interface FilterOption {
  label: string;
  value: string;
}

export type FilterType = 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'boolean' | 'number';

export interface FilterConfig {
  key: string;
  label: string;
  type: FilterType;
  placeholder?: string;
  options?: FilterOption[];
  min?: string | number;
  max?: string | number;
}

/** Valor de un filtro de rango de fechas. */
export interface DateRangeValue {
  from?: string;
  to?: string;
}

export type FilterValue = string | string[] | boolean | DateRangeValue;

export type FilterValues = Record<string, FilterValue | undefined>;

export interface DynamicFilterProps {
  filters: FilterConfig[];
  value?: FilterValues;
  onChange?: (values: FilterValues) => void;
  className?: string;
  defaultExpanded?: boolean;
  title?: string;
}

export interface ChevronIconProps {
  open: boolean;
}

/** Props comunes de cada campo del filtro; `V` es el tipo de valor que maneja el campo. */
export interface FieldProps<V> {
  filter: FilterConfig;
  value: V | undefined;
  onChange: (v: V | undefined) => void;
}

export type DateRangeKey = 'from' | 'to';

/** Desplegable que se cierra al hacer clic fuera. */
export interface UseDropdownResult {
  ref: RefObject<HTMLDivElement | null>;
  open: boolean;
  toggle: () => void;
  close: () => void;
}

export interface UseSelectFieldResult extends UseDropdownResult {
  triggerLabel: string;
  placeholderLabel: string;
  hasValue: boolean;
  pick: (optionValue: string | undefined) => void;
}

export interface UseMultiSelectFieldResult extends UseDropdownResult {
  triggerLabel: string;
  isEmpty: boolean;
  hasOptions: boolean;
  isChecked: (optionValue: string) => boolean;
  toggleOption: (optionValue: string) => void;
}

export interface UseDonutNumberFieldResult {
  dialRef: RefObject<HTMLDivElement | null>;
  min: number;
  max: number;
  displayValue: number;
  dashOffset: number;
  caption: string;
  handlePointerDown: (e: PointerEvent<HTMLDivElement>) => void;
  handlePointerMove: (e: PointerEvent<HTMLDivElement>) => void;
  handleKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
}

export interface UseDynamicFilterResult {
  expanded: boolean;
  activeCount: number;
  hasActive: boolean;
  toggleExpanded: () => void;
  handleChange: (key: string, fieldValue: FilterValue | undefined) => void;
  clearAll: () => void;
}
