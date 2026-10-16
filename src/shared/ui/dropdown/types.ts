import type * as React from 'react';

export interface DropdownMenuProps {
  children: React.ReactNode;
}

export interface DropdownTriggerProps {
  children: React.ReactNode;
}

export interface DropdownContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  className?: string;
}

export interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: React.ReactNode;
  shortcut?: string;
  className?: string;
}

export interface DropdownSeparatorProps {
  className?: string;
}

export interface DropdownLabelProps {
  children: React.ReactNode;
  className?: string;
}
