// Editar y borrar al final de cada fila (solo si el módulo se puede editar).
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/features/admin/core/ui/icons';
import type { RowActionsProps } from './types';

export function RowActions({ row, onEdit, onDelete }: Readonly<RowActionsProps>) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => onEdit(row)}>
        <Icon name="pencil" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Borrar"
        className="text-destructive hover:text-destructive"
        onClick={() => onDelete(row)}
      >
        <Icon name="trash" />
      </Button>
    </div>
  );
}
