// Una tabla del panel lateral de la consola: si está desplegada (solo visual) y qué se puede hacer con ella.
import * as React from 'react';
import type { TableInfo } from '@/features/admin/core/ui/lib/sql';
import { tableFlags } from '../lib/console';

export function useTableItem(table: TableInfo) {
  const [open, setOpen] = React.useState(false);
  return {
    open,
    toggle: () => setOpen(!open),
    ...tableFlags(table),
  };
}
