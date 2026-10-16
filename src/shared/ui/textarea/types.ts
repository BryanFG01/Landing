import type * as React from 'react';
import type { VariantProps } from 'class-variance-authority';
import type { textareaVariants } from './index';

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>,
    VariantProps<typeof textareaVariants> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  successMessage?: string;
  className?: string;
}
