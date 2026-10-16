// Tipos de AdminShell.tsx y de su menú de usuario (UserMenu.tsx).
import type * as React from 'react';
import type { BreadcrumbItem } from '@/shared/ui/breadcrumb';
import type { AdminUser } from '@/features/admin/core/domain/schema';

export interface UserMenuProps {
  user: AdminUser;
  isAdmin: boolean;
  onUsers: () => void;
}

export interface AdminShellProps {
  user: AdminUser;
  breadcrumb: BreadcrumbItem[];
  children: React.ReactNode;
}
