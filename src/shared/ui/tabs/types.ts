import type * as React from 'react';
import type { VariantProps } from 'class-variance-authority';
import type { tabsListVariants } from './index';

export interface TabsProps extends VariantProps<typeof tabsListVariants> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

export interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

export interface TabsTriggerProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}
