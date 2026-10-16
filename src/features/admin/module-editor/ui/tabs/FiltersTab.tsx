// Pestaña "Filtros": los filtros que aparecen encima de la tabla del módulo.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/features/admin/core/ui/icons';
import { FilterRow } from './FilterRow';
import type { EditorProps } from '../types';

export function FiltersTab({ editor }: Readonly<EditorProps>) {
  const { mod, filterActions } = editor;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Filtros que aparecen encima de la tabla. Se aplican en la base de datos, no solo a la página visible.
        </p>
        <Button variant="outline" size="sm" onClick={filterActions.suggest}>
          Generar sugeridos
        </Button>
      </div>
      {mod.filters.map((fl, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <FilterRow key={i} editor={editor} filter={fl} index={i} />
      ))}
      <Button variant="outline" onClick={filterActions.add}>
        <Icon name="plus" /> Añadir filtro
      </Button>
    </>
  );
}
