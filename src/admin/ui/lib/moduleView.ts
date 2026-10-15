// Vista de un módulo: datos preparados para pintar a partir de su definición (sin React).
import type { FilterConfig as UiFilter } from '../../../components/ui/dynamic-filter';
import {
  SYSTEM_FIELDS,
  type ColumnConfig,
  type FieldConfig,
  type ModuleAccess,
  type ModuleDefinition,
  type Option,
} from '../../schema';

export type ViewModule = ModuleDefinition & { id: number };
export type SortState = { field: string; dir: 'asc' | 'desc' };

const SOURCE_BADGE: Record<string, string> = { table: 'Tabla', query: 'Consulta · solo lectura' };

/** Etiqueta junto al título: el origen (tabla, consulta) o "Solo lectura" si el usuario no puede editar. */
export const moduleBadge = (mod: ViewModule, access: ModuleAccess) =>
  SOURCE_BADGE[mod.source_type] ?? (access === 'view' ? 'Solo lectura' : undefined);

/** Se puede crear, editar, borrar e importar (las consultas nunca). */
export const canEditModule = (mod: ViewModule, access: ModuleAccess) => access === 'edit' && mod.source_type !== 'query';

export const fieldMap = (fields: FieldConfig[]) => new Map(fields.map((f) => [f.key, f]));

/** Filtros de la configuración → formato de DynamicFilter (nuvo-ui). */
export function uiFilters(
  mod: ViewModule,
  fields: Map<string, FieldConfig>,
  relationOptions: Record<string, Option[]>,
): UiFilter[] {
  return mod.filters.map((f) => {
    const field = fields.get(f.field);
    const options = field?.type === 'relation' ? relationOptions[field.key] : field?.options;
    return {
      key: f.name,
      label: f.label,
      type: f.control,
      placeholder: f.placeholder ?? (f.control === 'boolean' ? f.label : undefined),
      options: options ?? [],
    };
  });
}

/** Opciones de "Ordenar por": columnas marcadas como ordenables y el orden por defecto del módulo. */
export function sortOptions(mod: ViewModule, fields: Map<string, FieldConfig>) {
  const keys = [...new Set([mod.default_sort, ...mod.column_configs.filter((c) => c.sortable).map((c) => c.column)])];
  return keys.map((k) => ({
    value: k,
    label: mod.column_configs.find((c) => c.column === k)?.headerText ?? fields.get(k)?.label ?? SYSTEM_FIELDS[k]?.label ?? k,
  }));
}

export const ALIGN_CLASS: Record<NonNullable<ColumnConfig['align']>, string | undefined> = {
  left: undefined,
  center: 'text-center',
  right: 'text-right tabular-nums',
};

/** Parámetros de la lista (los mismos para exportar, sin paginación). */
export function listParams(sort: SortState, filters: Record<string, unknown>, page?: { page: number; size: number }) {
  const qs = new URLSearchParams({ sort: sort.field, dir: sort.dir, filters: JSON.stringify(filters) });
  if (page) {
    qs.set('page', String(page.page));
    qs.set('page_size', String(page.size));
  }
  return qs;
}

/** "Mostrando 21–40 de 57" y número de páginas. */
export function pageInfo(total: number, page: number, pageSize: number) {
  return {
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    from: total ? (page - 1) * pageSize + 1 : 0,
    to: Math.min(page * pageSize, total),
  };
}

export const rowPath = (moduleKey: string, id: string | number) => `/m/${moduleKey}/${encodeURIComponent(String(id))}`;
