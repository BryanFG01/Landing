// Una tabla o vista del esquema datos en el panel lateral: columnas, ver filas y crear un módulo.
import * as React from 'react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { Icon } from '@/features/admin/core/ui/icons';
import { useTableItem } from './hooks/useTableItem';
import { rowsQuery } from './lib/console';
import type { TableItemProps } from './SidePanels.types';

export function TableItem({ table: t, onQuery, onCreateModule }: Readonly<TableItemProps>) {
  const item = useTableItem(t);
  return (
    <li>
      <button
        type="button"
        onClick={item.toggle}
        aria-expanded={item.open}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
      >
        <Icon name={item.icon} className="size-4 text-muted-foreground" />
        <span className="flex-1 truncate font-mono text-xs">{t.name}</span>
        {item.isView && (
          <Badge variant="muted" size="sm">
            vista
          </Badge>
        )}
      </button>
      {item.open && (
        <div className="mt-1 mb-2 ml-8 space-y-2">
          <ul className="space-y-0.5 text-xs">
            {t.columns.map((c) => (
              <li key={c.name} className="flex justify-between gap-2">
                <span className={cn('font-mono', c.pk && 'font-semibold text-primary')}>{c.name}</span>
                <span className="truncate text-muted-foreground">{c.type}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="ghost" onClick={() => onQuery(rowsQuery(t.name))}>
              Ver filas
            </Button>
            {item.editable && (
              <Button size="sm" variant="outline" onClick={() => onCreateModule(t.name)}>
                Crear módulo
              </Button>
            )}
          </div>
          {item.withoutPk && (
            <p className="text-xs text-muted-foreground">Sin clave primaria: no se puede editar desde un módulo.</p>
          )}
        </div>
      )}
    </li>
  );
}
