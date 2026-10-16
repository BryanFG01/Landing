// Celda de acceso de la tabla de usuarios: administrador o el resumen de sus módulos.
import * as React from 'react';
import { Badge } from '@/shared/ui/badge';
import { isAdminUser } from '@/features/admin/core/ui/lib/roles';
import { accessSummary, permissionNames } from './lib/users';
import type { UserAccessCellProps } from './UsersView.types';

export function UserAccessCell({ user, moduleNames }: Readonly<UserAccessCellProps>) {
  return isAdminUser(user) ? (
    <Badge size="sm">Administrador</Badge>
  ) : (
    <span className="text-sm text-muted-foreground" title={permissionNames(user.permissions, moduleNames)}>
      {accessSummary(user.permissions)}
    </span>
  );
}
