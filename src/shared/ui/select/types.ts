export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectGroup {
  label?: string;
  options: SelectOption[];
}

export interface SelectProps {
  options?: SelectOption[];
  groups?: SelectGroup[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  id?: string;
  className?: string;
}

export interface MultiSelectProps {
  options?: SelectOption[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  id?: string;
  className?: string;
  selectAllLabel?: string;
}

export type CheckState = boolean | 'indeterminate';

export interface MultiSelectCheckboxProps {
  state: CheckState;
}

/** Qué marca pinta la casilla según su estado. */
export interface CheckboxMarks {
  isActive: boolean;
  isIndeterminate: boolean;
  isChecked: boolean;
}

export interface MultiSelectItem extends SelectOption {
  checked: boolean;
}

export interface UseMultiSelectOptions {
  options: SelectOption[];
  value?: string[];
  defaultValue: string[];
  onValueChange?: (value: string[]) => void;
  placeholder: string;
}

export interface UseMultiSelectResult {
  items: MultiSelectItem[];
  selectAllState: CheckState;
  displayLabel: string;
  isPlaceholder: boolean;
  toggleOption: (optionValue: string) => void;
  toggleSelectAll: () => void;
}
