// Un filtro del módulo: campo, etiqueta, control, condición (si es numérico) y nombre del parámetro.
import * as React from 'react';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { NUMBER_OPERATORS, type FilterConfig } from '@/features/admin/core/domain/schema';
import { optionsOf } from '@/features/admin/core/ui/lib/lists';
import { filterControlChoices, isNumberFilter } from '../lib/editorView';
import { SEARCH_ALL } from '../lib/moduleEditor';
import { RowTools } from '../RowTools';
import type { FilterRowProps } from './FilterRow.types';

const OPERATOR_OPTIONS = optionsOf(NUMBER_OPERATORS);
const SEARCH_OPTION = { value: SEARCH_ALL, label: 'Búsqueda general (todos los textos)' };

export function FilterRow({ editor, filter: fl, index: i }: Readonly<FilterRowProps>) {
  const { mod, choices, sourceColumns, filterActions: actions } = editor;
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-end gap-3">
        <Select
          className="min-w-44 flex-1"
          label="Filtra por"
          options={[SEARCH_OPTION, ...choices]}
          value={fl.field}
          onValueChange={(field) => actions.setField(i, field)}
        />
        <div className="min-w-40 flex-1">
          <Input label="Etiqueta" value={fl.label} onChange={(e) => actions.update(i, { label: e.target.value })} />
        </div>
        <Select
          className="min-w-40 flex-1"
          label="Control"
          options={filterControlChoices(mod, sourceColumns, fl.field)}
          value={fl.control}
          onValueChange={(v) => actions.update(i, { control: v as FilterConfig['control'] })}
        />
        {isNumberFilter(fl) && (
          <Select
            className="w-40"
            label="Condición"
            options={OPERATOR_OPTIONS}
            value={fl.operator ?? 'eq'}
            onValueChange={(v) => actions.update(i, { operator: v as FilterConfig['operator'] })}
          />
        )}
        <div className="w-36">
          <Input label="Nombre (parámetro)" value={fl.name} onChange={(e) => actions.update(i, { name: e.target.value.toLowerCase() })} />
        </div>
        <RowTools onUp={() => actions.move(i, -1)} onDown={() => actions.move(i, 1)} onRemove={() => actions.remove(i)} />
      </div>
    </Card>
  );
}
