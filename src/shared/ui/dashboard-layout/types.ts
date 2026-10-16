import type * as React from 'react';

export interface DashboardLayoutProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  sidebarWidth?: string;
  headerHeight?: string;
  footerHeight?: string;
  className?: string;
}

export interface DashboardHeaderProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  center?: React.ReactNode;
  className?: string;
}

export interface DashboardSidebarProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export interface DashboardNavItem {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  badge?: string | number;
  onClick?: () => void;
}

export interface DashboardNavProps {
  items: DashboardNavItem[];
}
