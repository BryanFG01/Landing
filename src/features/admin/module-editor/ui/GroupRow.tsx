// Una fila de la tarjeta de grupos: nombre y posición editables, guardar y borrar.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Icon } from '@/features/admin/core/ui/icons';
import { useGroupRow } from './hooks/useGroupRow';
import type { GroupRowProps } from './GroupRow.types';

export function GroupRow({ group, onSave, onDelete }: Readonly<GroupRowProps>) {
  const row = useGroupRow(group, onSave);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <Input aria-label="Nombre del grupo" value={row.name} onChange={(e) => row.setName(e.target.value)} />
      </div>
      <div className="w-20">
        <Input aria-label="Posición" type="number" value={row.order} onChange={(e) => row.setOrder(e.target.value)} />
      </div>
      <Button variant="outline" size="sm" disabled={!row.dirty} onClick={row.save}>
        Guardar
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Borrar grupo ${group.name}`}
        className="text-destructive hover:text-destructive"
        onClick={onDelete}
      >
        <Icon name="trash" />
      </Button>
    </div>
  );
}
