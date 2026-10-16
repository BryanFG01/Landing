// Acciones de una fila de usuarios: editar y borrar (no se puede borrar la propia cuenta).
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/features/admin/core/ui/icons';
import type { UserActionsCellProps } from './UsersView.types';

export function UserActionsCell({ user, isMe, onEdit, onDelete }: Readonly<UserActionsCellProps>) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => onEdit(user)}>
        <Icon name="pencil" />
      </Button>
      {!isMe && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Borrar"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(user)}
        >
          <Icon name="trash" />
        </Button>
      )}
    </div>
  );
}
