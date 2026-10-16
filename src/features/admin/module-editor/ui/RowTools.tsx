// Botones de subir, bajar y quitar de cada fila (campos, columnas, filtros).
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/features/admin/core/ui/icons';
import type { RowToolsProps } from './RowTools.types';

export function RowTools({ onUp, onDown, onRemove }: Readonly<RowToolsProps>) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button type="button" variant="ghost" size="icon" aria-label="Subir" onClick={onUp}>
        <Icon name="arrow-up" />
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-label="Bajar" onClick={onDown}>
        <Icon name="arrow-down" />
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-label="Quitar" className="text-destructive hover:text-destructive" onClick={onRemove}>
        <Icon name="trash" />
      </Button>
    </div>
  );
}
