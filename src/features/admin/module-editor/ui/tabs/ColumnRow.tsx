// Una columna de la tabla del módulo: campo, encabezado, formato, alineación y si se puede ordenar.
import * as React from 'react';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { COLUMN_TYPES, type ColumnConfig } from '@/features/admin/core/domain/schema';
import { optionsOf } from '@/features/admin/core/ui/lib/lists';
import { ALIGN_OPTIONS } from '../lib/moduleEditor';
import { RowTools } from '../RowTools';
import type { ColumnRowProps } from './ColumnRow.types';

const COLUMN_TYPE_OPTIONS = optionsOf(COLUMN_TYPES);

export function ColumnRow({ editor, column: c, index: i }: Readonly<ColumnRowProps>) {
  const { choices, columnActions: actions } = editor;
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-end gap-3">
        <Select
          className="min-w-40 flex-1"
          label="Campo"
          options={choices}
          value={c.column}
          onValueChange={(column) => actions.setField(i, column)}
        />
        <div className="min-w-40 flex-1">
          <Input label="Encabezado" value={c.headerText} onChange={(e) => actions.update(i, { headerText: e.target.value })} />
        </div>
        <Select
          className="min-w-36 flex-1"
          label="Formato"
          options={COLUMN_TYPE_OPTIONS}
          value={c.data_type}
          onValueChange={(v) => actions.update(i, { data_type: v as ColumnConfig['data_type'] })}
        />
        <Select
          className="w-32"
          label="Alineación"
          options={ALIGN_OPTIONS}
          value={c.align ?? 'left'}
          onValueChange={(v) => actions.update(i, { align: v as ColumnConfig['align'] })}
        />
        <div className="w-24">
          <Input label="Si está vacío" value={c.null_display ?? ''} onChange={(e) => actions.update(i, { null_display: e.target.value })} />
        </div>
        <div className="pb-1.5">
          <Switch label="Ordenable" checked={c.sortable === true} onCheckedChange={(sortable) => actions.update(i, { sortable })} />
        </div>
        <RowTools onUp={() => actions.move(i, -1)} onDown={() => actions.move(i, 1)} onRemove={() => actions.remove(i)} />
      </div>
    </Card>
  );
}
