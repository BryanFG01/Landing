import type * as React from 'react';

export interface SidebarChildItem {
  label: string;
  href: string;
  icon?: React.ElementType<{ className?: string; 'aria-hidden'?: string }>;
}

export interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ElementType<{ className?: string; 'aria-hidden'?: string }>;
  badge?: string | number;
  children?: SidebarChildItem[];
}

export interface SidebarSection {
  section: string;
  items: SidebarItem[];
}

export interface SidebarProps {
  /** Lista plana de items, o agrupada por secciones */
  items?: SidebarItem[];
  sections?: SidebarSection[];
  logo?: React.ReactNode;
  footer?: React.ReactNode;
  defaultCollapsed?: boolean;
  storageKey?: string;
  activeHref?: string;
  onNavigate?: (href: string) => void;
  className?: string;
  width?: number;
}

/** Entrada de useSidebar: las props del menú que afectan al estado, con los valores por defecto ya puestos. */
export type UseSidebarOptions = Pick<SidebarProps, 'items' | 'sections' | 'onNavigate'> & {
  storageKey: string;
  defaultCollapsed: boolean;
};

export interface ChevronDownIconProps {
  open: boolean;
}

export interface NavItemProps {
  item: SidebarItem;
  activeHref?: string;
  onNavigate?: (href: string, e: React.MouseEvent<HTMLAnchorElement>) => void;
  openGroups: Set<string>;
  onToggleGroup: (href: string) => void;
}
