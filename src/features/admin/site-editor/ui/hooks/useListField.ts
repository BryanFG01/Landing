// Estado de un campo de lista del editor: qué elemento está desplegado y las acciones de añadir, mover y quitar.
import * as React from 'react';
import { emptyItem } from '@/features/landing/domain/sitio';
import { removeAt, replaceAt, swap } from '@/features/admin/core/ui/lib/lists';
import type { ListDef, Values } from '../Fields.types';

export function useListField(def: ListDef, value: Values[], onChange: (v: Values[]) => void) {
  // Elemento desplegado (solo visual).
  const [open, setOpen] = React.useState<number | null>(null);

  function move(i: number, delta: number) {
    onChange(swap(value, i, delta));
    if (open === i) setOpen(i + delta);
  }

  function remove(i: number) {
    onChange(removeAt(value, i));
    setOpen(null);
  }

  function add() {
    onChange([...value, emptyItem(def.fields)]);
    setOpen(value.length);
  }

  return {
    canRemove: !def.min || value.length > def.min,
    canAdd: !def.max || value.length < def.max,
    isOpen: (i: number) => open === i,
    toggle: (i: number) => setOpen(open === i ? null : i),
    update: (i: number, item: Values) => onChange(replaceAt(value, i, item)),
    move,
    remove,
    add,
  };
}
