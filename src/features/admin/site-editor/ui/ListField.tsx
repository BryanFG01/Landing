// Campo de lista del editor de Sitio web: elementos desplegables que se ordenan, quitan y añaden.
// El estado (qué elemento está abierto) y las acciones están en hooks/useListField.ts.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/features/admin/core/ui/icons';
import { Fields } from './Fields';
import type { ListFieldProps } from './Fields.types';
import { useListField } from './hooks/useListField';
import { itemTitle } from './lib/siteEditor';

export function ListField({ def, value, onChange }: Readonly<ListFieldProps>) {
  const list = useListField(def, value, onChange);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {def.label} <span className="text-muted-foreground">({value.length})</span>
      </p>
      {def.help && <p className="text-xs text-muted-foreground">{def.help}</p>}
      <div className="divide-y divide-border rounded-lg border border-border">
        {value.map((item, i) => (
          // Los elementos no tienen id propio: se identifican por su posición.
          // eslint-disable-next-line react/no-array-index-key
          <div key={i}>
            <div className="flex items-center gap-1 px-3 py-2">
              <button
                type="button"
                onClick={() => list.toggle(i)}
                aria-expanded={list.isOpen(i)}
                className="min-w-0 flex-1 truncate text-left text-sm hover:text-primary"
              >
                <span className="mr-2 text-muted-foreground tabular-nums">{i + 1}.</span>
                {itemTitle(def.fields, item, def.itemLabel, i)}
              </button>
              <Button type="button" variant="ghost" size="icon" aria-label="Subir" onClick={() => list.move(i, -1)}>
                <Icon name="arrow-up" />
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Bajar" onClick={() => list.move(i, 1)}>
                <Icon name="arrow-down" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Quitar"
                disabled={!list.canRemove}
                className="text-destructive hover:text-destructive"
                onClick={() => list.remove(i)}
              >
                <Icon name="trash" />
              </Button>
            </div>
            {list.isOpen(i) && (
              <div className="space-y-4 border-t border-border bg-muted/30 p-3">
                <Fields fields={def.fields} value={item} onChange={(v) => list.update(i, v)} />
              </div>
            )}
          </div>
        ))}
        {!value.length && <p className="p-3 text-sm text-muted-foreground">Vacío.</p>}
      </div>
      <Button type="button" size="sm" variant="outline" disabled={!list.canAdd} onClick={list.add}>
        <Icon name="plus" /> Añadir {def.itemLabel.toLowerCase()}
      </Button>
    </div>
  );
}
