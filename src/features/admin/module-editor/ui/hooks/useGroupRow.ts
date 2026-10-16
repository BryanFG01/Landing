// Borrador local de una fila de grupo (nombre y posición): solo visual hasta pulsar Guardar.
import * as React from 'react';
import type { ModuleGroup } from '@/features/admin/core/domain/schema';

export function useGroupRow(group: ModuleGroup, onSave: (patch: Partial<ModuleGroup>) => void) {
  const [name, setName] = React.useState(group.name);
  const [order, setOrder] = React.useState(String(group.sort_order));
  return {
    name,
    setName,
    order,
    setOrder,
    dirty: name !== group.name || order !== String(group.sort_order),
    save: () => onSave({ name, sort_order: Number(order) || 0 }),
  };
}
