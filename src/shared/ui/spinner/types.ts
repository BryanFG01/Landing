import type { VariantProps } from 'class-variance-authority';
import type { spinnerVariants } from './index';

export interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  label?: string;
  className?: string;
}
