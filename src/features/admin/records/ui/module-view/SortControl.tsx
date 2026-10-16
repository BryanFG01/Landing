// "Ordenar por": campo y dirección del orden de la lista.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Select } from '@/shared/ui/select';
import { Icon } from '@/features/admin/core/ui/icons';
import { isAscending } from '../lib/moduleView';
import type { SortControlProps } from './types';

export function SortControl({ options, sort, onField, onToggleDir }: Readonly<SortControlProps>) {
  if (!options.length) return null;
  const asc = isAscending(sort);
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Ordenar por</span>
      <Select className="w-44" options={options} value={sort.field} onValueChange={onField} />
      <Button variant="outline" size="icon" aria-label={asc ? 'Orden ascendente' : 'Orden descendente'} onClick={onToggleDir}>
        <Icon name={asc ? 'arrow-up' : 'arrow-down'} />
      </Button>
    </div>
  );
}
