export interface CheckboxProps {
  checked?: boolean | 'indeterminate';
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}
