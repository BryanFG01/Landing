// Insignia de estado activo/inactivo (módulos, usuarios).
import * as React from 'react';
import { Badge } from '../../components/ui/badge';

export function StatusBadge({ active, off = 'Inactivo' }: Readonly<{ active: boolean; off?: string }>) {
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
