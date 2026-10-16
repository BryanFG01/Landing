// Celda de nombre de la tabla de usuarios, con "(tú)" en la propia cuenta.
import * as React from 'react';
import type { UserNameCellProps } from './UsersView.types';

export function UserNameCell({ name, isMe }: Readonly<UserNameCellProps>) {
  return (
    <span className="font-medium">
      {name} {isMe && <span className="text-xs text-muted-foreground">(tú)</span>}
    </span>
  );
}
