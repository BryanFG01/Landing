// Celda de último acceso de la tabla de usuarios ("Nunca" si no ha entrado).
import * as React from 'react';
import { formatDateTime } from '@/features/admin/core/ui/lib/format';
import type { LastLoginCellProps } from './UsersView.types';

export function LastLoginCell({ value }: Readonly<LastLoginCellProps>) {
  return <>{value ? formatDateTime(String(value)) : <span className="text-muted-foreground">Nunca</span>}</>;
}
