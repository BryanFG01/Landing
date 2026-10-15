// Pestañas del constructor: campos del formulario, columnas de la tabla y filtros.
import * as React from 'react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { COLUMN_TYPES, FILTER_CONTROLS, NUMBER_OPERATORS, type ColumnConfig, type FilterConfig } from '../../schema';
import type { ModuleEditorState } from '../hooks/useModuleEditor';
import { Icon } from '../icons';
import { optionsOf, patchAt, removeAt, swap } from '../lib/lists';
import {
  ALIGN_OPTIONS,
  columnForField,
  filterControls,
  filterForField,
  newColumn,
  newFilter,
  SEARCH_ALL,
  suggestColumns,
  suggestFilters,
  tableColumnChoices,
} from '../lib/moduleEditor';
import { FieldRow } from './FieldRow';
import { RowTools } from './RowTools';

const COLUMN_TYPE_OPTIONS = optionsOf(COLUMN_TYPES);
const OPERATOR_OPTIONS = optionsOf(NUMBER_OPERATORS);
const SEARCH_OPTION = { value: SEARCH_ALL, label: 'Búsqueda general (todos los textos)' };

const FIELDS_HELP = {
  table: 'Los campos son las columnas de la tabla que se rellenan en el formulario. Las autonuméricas y las que tienen valor por defecto pueden quedarse fuera.',
  other: 'Los campos forman el formulario de alta y edición. Cambiar o quitar un campo no borra los datos ya guardados.',
};

export function FieldsTab({ editor }: Readonly<{ editor: ModuleEditorState }>) {
  const { mod, draft, otherModules, sourceColumns } = editor;
  const isTable = mod.source_type === 'table';
  return (
    <>
      <p className="text-sm text-muted-foreground">{isTable ? FIELDS_HELP.table : FIELDS_HELP.other}</p>
      {mod.fields.map((f, i) => (
        <FieldRow
          key={draft.fieldIds[i]}
          field={f}
          index={i}
          autoKey={draft.autoKey(i)}
          modules={otherModules}
          columnChoices={isTable ? tableColumnChoices(sourceColumns, mod.source_pk, f.key) : undefined}
          onChange={(field, keyEdited) => draft.updateField(i, field, keyEdited)}
          tools={<RowTools onUp={() => draft.moveField(i, -1)} onDown={() => draft.moveField(i, 1)} onRemove={() => draft.removeField(i)} />}
        />
      ))}
      <Button variant="outline" onClick={draft.addField}>
        <Icon name="plus" /> Añadir campo
      </Button>
    </>
  );
}

function ColumnRow({ editor, column: c, index: i }: Readonly<{ editor: ModuleEditorState; column: ColumnConfig; index: number }>) {
  const { mod, draft, choices, sourceColumns } = editor;
  const columns = mod.column_configs;
  const update = (patch: Partial<ColumnConfig>) => draft.set({ column_configs: patchAt(columns, i, patch) });
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-end gap-3">
        <Select
          className="min-w-40 flex-1"
          label="Campo"
          options={choices}
          value={c.column}
          onValueChange={(column) => update(columnForField(mod, sourceColumns, column))}
        />
        <div className="min-w-40 flex-1">
          <Input label="Encabezado" value={c.headerText} onChange={(e) => update({ headerText: e.target.value })} />
        </div>
        <Select
          className="min-w-36 flex-1"
          label="Formato"
          options={COLUMN_TYPE_OPTIONS}
          value={c.data_type}
          onValueChange={(v) => update({ data_type: v as ColumnConfig['data_type'] })}
        />
        <Select
          className="w-32"
          label="Alineación"
          options={ALIGN_OPTIONS}
          value={c.align ?? 'left'}
          onValueChange={(v) => update({ align: v as ColumnConfig['align'] })}
        />
        <div className="w-24">
          <Input label="Si está vacío" value={c.null_display ?? ''} onChange={(e) => update({ null_display: e.target.value })} />
        </div>
        <div className="pb-1.5">
          <Switch label="Ordenable" checked={c.sortable === true} onCheckedChange={(sortable) => update({ sortable })} />
        </div>
        <RowTools
          onUp={() => draft.set({ column_configs: swap(columns, i, -1) })}
          onDown={() => draft.set({ column_configs: swap(columns, i, 1) })}
          onRemove={() => draft.set({ column_configs: removeAt(columns, i) })}
        />
      </div>
    </Card>
  );
}

export function ColumnsTab({ editor }: Readonly<{ editor: ModuleEditorState }>) {
  const { mod, draft, choices, sourceColumns, query } = editor;
  function regenerate() {
    // Formato según el tipo real de cada columna (tabla) o el detectado al probar la consulta.
    const types = new Map([
      ...sourceColumns.map((c) => [c.value, c.type] as const),
      ...(query.preview?.columns ?? []).map((c) => [c.name, c.type] as const),
    ]);
    draft.set({ column_configs: suggestColumns(mod.fields, mod.source_type, types) });
  }
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Columnas de la tabla del módulo, en este orden.</p>
        <Button variant="outline" size="sm" onClick={regenerate}>
          Generar desde los campos
        </Button>
      </div>
      {mod.column_configs.map((c, i) => (
        // Las columnas no tienen id propio (la misma columna puede repetirse): se identifican por su posición.
        // eslint-disable-next-line react/no-array-index-key
        <ColumnRow key={i} editor={editor} column={c} index={i} />
      ))}
      <Button variant="outline" onClick={() => draft.set({ column_configs: [...mod.column_configs, newColumn(choices)] })}>
        <Icon name="plus" /> Añadir columna
      </Button>
    </>
  );
}

function FilterRow({ editor, filter: fl, index: i }: Readonly<{ editor: ModuleEditorState; filter: FilterConfig; index: number }>) {
  const { mod, draft, choices, sourceColumns } = editor;
  const filters = mod.filters;
  const update = (patch: Partial<FilterConfig>) => draft.set({ filters: patchAt(filters, i, patch) });
  const controls = filterControls(mod, sourceColumns, fl.field);
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-end gap-3">
        <Select
          className="min-w-44 flex-1"
          label="Filtra por"
          options={[SEARCH_OPTION, ...choices]}
          value={fl.field}
          onValueChange={(field) => update(filterForField(mod, sourceColumns, field))}
        />
        <div className="min-w-40 flex-1">
          <Input label="Etiqueta" value={fl.label} onChange={(e) => update({ label: e.target.value })} />
        </div>
        <Select
          className="min-w-40 flex-1"
          label="Control"
          options={controls.map((c) => ({ value: c, label: FILTER_CONTROLS[c] }))}
          value={fl.control}
          onValueChange={(v) => update({ control: v as FilterConfig['control'] })}
        />
        {fl.control === 'number' && (
          <Select
            className="w-40"
            label="Condición"
            options={OPERATOR_OPTIONS}
            value={fl.operator ?? 'eq'}
            onValueChange={(v) => update({ operator: v as FilterConfig['operator'] })}
          />
        )}
        <div className="w-36">
          <Input label="Nombre (parámetro)" value={fl.name} onChange={(e) => update({ name: e.target.value.toLowerCase() })} />
        </div>
        <RowTools
          onUp={() => draft.set({ filters: swap(filters, i, -1) })}
          onDown={() => draft.set({ filters: swap(filters, i, 1) })}
          onRemove={() => draft.set({ filters: removeAt(filters, i) })}
        />
      </div>
    </Card>
  );
}

export function FiltersTab({ editor }: Readonly<{ editor: ModuleEditorState }>) {
  const { mod, draft } = editor;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Filtros que aparecen encima de la tabla. Se aplican en la base de datos, no solo a la página visible.
        </p>
        <Button variant="outline" size="sm" onClick={() => draft.set({ filters: suggestFilters(mod.fields) })}>
          Generar sugeridos
        </Button>
      </div>
      {mod.filters.map((fl, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <FilterRow key={i} editor={editor} filter={fl} index={i} />
      ))}
      <Button variant="outline" onClick={() => draft.set({ filters: [...mod.filters, newFilter(mod.filters)] })}>
        <Icon name="plus" /> Añadir filtro
      </Button>
    </>
  );
}
