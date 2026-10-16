// Constructor de módulos: acciones sobre las listas de columnas y filtros del borrador (cambiar, mover, quitar,
// añadir y generar sugeridos). Así las filas de las pestañas solo llaman a una acción con su posición.
import type { ColumnConfig, ColumnDataType, FilterConfig } from '@/features/admin/core/domain/schema';
import { patchAt, removeAt, swap } from '@/features/admin/core/ui/lib/lists';
import {
  columnForField,
  filterForField,
  newColumn,
  newFilter,
  suggestColumns,
  suggestFilters,
  type Choice,
  type QueryPreview,
  type SourceColumn,
} from '../lib/moduleEditor';
import type { ModuleDraft } from './useModuleDraft';

interface ListsInput {
  draft: ModuleDraft;
  sourceColumns: SourceColumn[];
  choices: Choice[];
  preview: QueryPreview | null;
}

export function useEditorLists({ draft, sourceColumns, choices, preview }: ListsInput) {
  const { mod, set } = draft;
  const columns = mod.column_configs;
  const filters = mod.filters;

  const updateColumn = (i: number, patch: Partial<ColumnConfig>) => set({ column_configs: patchAt(columns, i, patch) });
  const updateFilter = (i: number, patch: Partial<FilterConfig>) => set({ filters: patchAt(filters, i, patch) });

  function regenerateColumns() {
    // Formato según el tipo real de cada columna (tabla) o el detectado al probar la consulta.
    const types = new Map<string, ColumnDataType>([
      ...sourceColumns.map((c) => [c.value, c.type] as const),
      ...(preview?.columns ?? []).map((c) => [c.name, c.type] as const),
    ]);
    set({ column_configs: suggestColumns(mod.fields, mod.source_type, types) });
  }

  return {
    columnActions: {
      update: updateColumn,
      /** Al elegir el campo de la columna se ponen su encabezado y formato por defecto. */
      setField: (i: number, column: string) => updateColumn(i, columnForField(mod, sourceColumns, column)),
      move: (i: number, delta: number) => set({ column_configs: swap(columns, i, delta) }),
      remove: (i: number) => set({ column_configs: removeAt(columns, i) }),
      add: () => set({ column_configs: [...columns, newColumn(choices)] }),
      regenerate: regenerateColumns,
    },
    filterActions: {
      update: updateFilter,
      /** Al elegir el campo del filtro se ponen su control, etiqueta y nombre por defecto. */
      setField: (i: number, field: string) => updateFilter(i, filterForField(mod, sourceColumns, field)),
      move: (i: number, delta: number) => set({ filters: swap(filters, i, delta) }),
      remove: (i: number) => set({ filters: removeAt(filters, i) }),
      add: () => set({ filters: [...filters, newFilter(filters)] }),
      suggest: () => set({ filters: suggestFilters(mod.fields) }),
    },
  };
}
