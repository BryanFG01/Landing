export interface DatePickerProps {
  id?: string;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  value?: string; // "yyyy-mm-dd"
  onChange?: (value: string | undefined) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}
