// Insignia de estado activo/inactivo (módulos, usuarios).
import * as React from 'react';
import { Badge } from '@/shared/ui/badge';
import type { StatusBadgeProps } from './StatusBadge.types';

export function StatusBadge({ active, off = 'Inactivo' }: Readonly<StatusBadgeProps>) {
  return active ? (
    <Badge variant="success" size="sm" dot>
      Activo
    </Badge>
  ) : (
    <Badge variant="muted" size="sm">
      {off}
    </Badge>
  );
}
