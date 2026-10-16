import type * as React from 'react';
import type { VariantProps } from 'class-variance-authority';
import type { alertVariants } from './index';

export interface AlertProps extends VariantProps<typeof alertVariants> {
  title?: string;
  children?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}
