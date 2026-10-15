// Constructor de módulos: reglas puras para armar la definición (sugerencias, SQL de la tabla, aplicar una tabla o
// una consulta, opciones de los selectores). Sin React.
import {
  columnTypeFor,
  filterControlsFor,
  SYSTEM_FIELDS,
  type ColumnConfig,
  type ColumnDataType,
  type FieldConfig,
  type FieldType,
  type FilterConfig,
  type FilterControl,
  type ModuleDefinition,
  type ModuleGroup,
  type SourceType,
} from '../../schema';
import type { TableInfo } from './sql';

export type EditorModule = ModuleDefinition & { id?: number };
export type QueryColumn = { name: string; type: ColumnDataType; array: boolean };
export type QueryPreview = { columns: QueryColumn[]; rows: Record<string, unknown>[]; fields: FieldConfig[] };
export type Choice = { value: string; label: string };
/** Columna disponible para mostrar, ordenar o filtrar (de la tabla o de la consulta). */
export type SourceColumn = Choice & { type: ColumnDataType };

const STARTER_FIELDS: FieldConfig[] = [{ key: 'nombre', label: 'Nombre', type: 'text', required: true }];

export const NEW_MODULE: EditorModule = {
  module_key: '',
  source_type: 'records',
  source: null,
  source_pk: null,
  name: '',
  description: '',
  group_id: null,
  icon: 'squares',
  sort_order: 0,
  fields: STARTER_FIELDS,
  column_configs: [],
  filters: [],
  default_sort: 'created_at',
  default_dir: 'desc',
  page_size: 20,
  is_active: true,
};

/** "Precio de venta" → "precio_de_venta" */
export function slugify(s: string) {
  const slug = s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/(^_+)|(_+$)/g, '')
    .slice(0, 48);
  if (/^[a-z]/.test(slug)) return slug;
  return slug ? `c_${slug}`.slice(0, 48) : '';
}

/** "clientes_vip" → "Clientes vip" */
const humanize = (name: string) => name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ');

// ─── Sugerencias ─────────────────────────────────────────────────────────────

const CREATED_COLUMN: ColumnConfig = {
  column: 'created_at',
  headerText: 'Creado',
  data_type: 'datetime',
  align: 'left',
  sortable: true,
  null_display: '—',
};

/** Columnas sugeridas: los primeros campos y, en registros, la fecha de creación. */
export function suggestColumns(fields: FieldConfig[], source: SourceType = 'records', types?: Map<string, ColumnDataType>): ColumnConfig[] {
  const cols: ColumnConfig[] = fields
    .filter((f) => f.type !== 'textarea' && f.type !== 'file')
    .slice(0, source === 'query' ? 10 : 6)
    .map((f): ColumnConfig => {
      // Las listas se ven como etiqueta aunque en la tabla sean texto (CHECK ... IN o ENUM).
      const data_type = (f.type === 'select' ? undefined : types?.get(f.key)) ?? columnTypeFor(f.type);
      return {
        column: f.key,
        headerText: f.label,
        data_type,
        align: data_type === 'number' || data_type === 'currency' ? 'right' : 'left',
        sortable: f.type !== 'multiselect' && f.type !== 'image',
        null_display: '—',
      };
    });
  return source === 'records' ? [...cols, CREATED_COLUMN] : cols;
}

const MAX_SUGGESTED_FILTERS = 6;

/** Filtros sugeridos: búsqueda general + listas, relaciones, sí/no, fechas, precios y números (hasta 6). */
export function suggestFilters(fields: FieldConfig[]): FilterConfig[] {
  const out: FilterConfig[] = [{ name: 'buscar', label: 'Buscar', field: '*', control: 'text' }];
  for (const f of fields) {
    if (['select', 'multiselect', 'relation'].includes(f.type)) {
      out.push({ name: f.key, label: f.label, field: f.key, control: 'multiselect' });
    } else if (['boolean', 'date', 'currency', 'number'].includes(f.type)) {
      out.push({ name: f.key, label: f.label, field: f.key, control: filterControlsFor(f.type)[0] });
    }
  }
  return out.slice(0, MAX_SUGGESTED_FILTERS);
}

// ─── Origen de los datos ─────────────────────────────────────────────────────

export const SOURCE_HELP: Record<SourceType, string> = {
  records: 'Formulario libre. Los datos se guardan en el panel.',
  table: 'Ver y editar una tabla real de la base. Se puede crear aquí mismo con SQL.',
  query: 'Un SELECT: reportes, totales, cruces. Solo lectura.',
};

export const SOURCE_ICON: Record<SourceType, string> = { records: 'file', table: 'table', query: 'code' };

/** Cambiar el tipo de origen de un módulo nuevo: se empieza de cero con ese origen. */
export function sourceReset(source_type: SourceType): { fields: FieldConfig[]; patch: Partial<EditorModule> } {
  const isRecords = source_type === 'records';
  return {
    fields: isRecords ? STARTER_FIELDS : [],
    patch: {
      source_type,
      source: null,
      source_pk: null,
      column_configs: isRecords ? suggestColumns(STARTER_FIELDS) : [],
      filters: [],
      default_sort: isRecords ? 'created_at' : '',
    },
  };
}

/** Módulo sobre una tabla: campos, columnas y filtros sugeridos a partir de sus columnas. */
export function tableSetup(mod: EditorModule, t: TableInfo, keyTouched: boolean): { fields: FieldConfig[]; patch: Partial<EditorModule> } {
  const types = new Map(t.columns.map((c) => [c.name, c.data_type]));
  const fields = t.suggested_fields;
  const pkColumn: ColumnConfig = { column: t.pk!, headerText: 'ID', data_type: 'number', align: 'left', sortable: true, null_display: '—' };
  return {
    fields,
    patch: {
      source: t.name,
      source_pk: t.pk,
      column_configs: [pkColumn, ...suggestColumns(fields, 'table', types).filter((c) => c.column !== t.pk)],
      filters: suggestFilters(fields),
      default_sort: t.pk ?? '',
      ...(mod.name ? {} : { name: t.comment?.trim().slice(0, 60) || humanize(t.name) }),
      ...(keyTouched ? {} : { module_key: slugify(t.name) }),
    },
  };
}

/**
 * Módulo de consulta tras probarla: los campos son sus columnas (con las etiquetas que ya se hubieran puesto). Las
 * columnas y filtros que ya no existen en la consulta se quitan; si no queda ninguna columna, se sugieren.
 */
export function querySetup(mod: EditorModule, preview: QueryPreview): { fields: FieldConfig[]; patch: Partial<EditorModule> } {
  const labels = new Map(mod.fields.map((f) => [f.key, f.label]));
  const fields = preview.fields.map((f) => ({ ...f, label: labels.get(f.key) ?? f.label }));
  const types = new Map(preview.columns.map((c) => [c.name, c.type]));
  const names = new Set(preview.columns.map((c) => c.name));
  const kept = mod.column_configs.filter((c) => names.has(c.column));
  return {
    fields,
    patch: {
      column_configs: kept.length ? kept : suggestColumns(fields, 'query', types),
      filters: mod.filters.filter((f) => f.field === '*' || names.has(f.field)),
      default_sort: names.has(mod.default_sort) ? mod.default_sort : (preview.columns[0]?.name ?? ''),
    },
  };
}

// ─── SQL de la tabla desde el constructor ────────────────────────────────────

/** Tipo de columna de PostgreSQL para cada tipo de campo, al generar el CREATE TABLE. */
const SQL_TYPES: Record<FieldType, string> = {
  text: 'text',
  textarea: 'text',
  email: 'text',
  url: 'text',
  phone: 'text',
  number: 'numeric',
  currency: 'numeric(14,2)',
  date: 'date',
  boolean: 'boolean',
  select: 'text',
  multiselect: 'text[]',
  relation: 'integer',
  image: 'jsonb',
  file: 'jsonb',
};

// De ejemplo: una lista con CHECK ... IN (el constructor la convierte en lista y filtro).
const DEFAULT_COLUMNS = [
  'nombre text NOT NULL',
  'descripcion text',
  'precio numeric(14,2)',
  "categoria text CHECK (categoria IN ('huevos', 'pollos', 'otros'))",
  'activo boolean NOT NULL DEFAULT true',
];
const DEFAULT_COMMENTS: [string, string][] = [['categoria', 'Categoría']];
const RESERVED = new Set(['id', 'creado', 'updated_at']);

const sqlText = (s: string) => `'${s.replaceAll("'", "''")}'`;

function columnSql(f: FieldConfig) {
  if (f.type === 'boolean') return `${f.key} boolean NOT NULL DEFAULT false`;
  const base = `${f.key} ${SQL_TYPES[f.type]}${f.required ? ' NOT NULL' : ''}`;
  const values = f.type === 'select' ? (f.options ?? []).map((o) => sqlText(o.value)) : [];
  return values.length ? `${base} CHECK (${f.key} IN (${values.join(', ')}))` : base;
}

/**
 * CREATE TABLE de partida a partir del nombre del módulo y de los campos que ya tenga. Lleva también lo que el
 * constructor sabe leer del SQL: listas con CHECK ... IN, el nombre del módulo (COMMENT ON TABLE) y las etiquetas de
 * los campos (COMMENT ON COLUMN).
 */
export function createTableSql(name: string, fields: FieldConfig[]) {
  const table = slugify(name) || 'mi_tabla';
  const cols = fields.filter((f) => /^[a-z_]\w*$/.test(f.key) && !RESERVED.has(f.key));
  const lines = [
    'id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY',
    ...(cols.length ? cols.map(columnSql) : DEFAULT_COLUMNS),
    'creado timestamptz NOT NULL DEFAULT now()',
    'updated_at timestamptz',
  ];
  const labels = cols.length
    ? cols.filter((f) => f.label && f.label !== humanize(f.key)).map((f): [string, string] => [f.key, f.label])
    : DEFAULT_COMMENTS;
  const comments = [
    `COMMENT ON TABLE ${table} IS ${sqlText(name.trim() || humanize(table))};`,
    ...labels.map(([key, label]) => `COMMENT ON COLUMN ${table}.${key} IS ${sqlText(label)};`),
  ];
  return `CREATE TABLE ${table} (\n  ${lines.join(',\n  ')}\n);\n\n${comments.join('\n')}`;
}

export const alterTableSql = (table: string) => `ALTER TABLE ${table}\n  ADD COLUMN nueva_columna text;`;

/** Tabla afectada por un CREATE/ALTER TABLE (para traer sus columnas al terminar). */
export function tableNameIn(sql: string) {
  return /\b(?:create|alter)\s+table\s+(?:if\s+(?:not\s+)?exists\s+)?(?:datos\.)?"?([a-z_]\w*)/i.exec(sql)?.[1]?.toLowerCase();
}

// ─── Opciones de lista en texto ──────────────────────────────────────────────
// Una por línea: "valor | Etiqueta" o solo "Etiqueta" (el valor se saca de la etiqueta).

export const optionsToText = (o: FieldConfig['options']) =>
  (o ?? []).map((x) => (slugify(x.label) === x.value ? x.label : `${x.value} | ${x.label}`)).join('\n');

export const textToOptions = (t: string) =>
  t
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [a, b] = line.split('|').map((s) => s.trim());
      return b ? { value: a, label: b } : { value: slugify(a) || a, label: a };
    });

// ─── Columnas y filtros ──────────────────────────────────────────────────────

/** Columnas de la tabla real (vacío en registros y consultas). */
export const sourceColumnsOf = (mod: EditorModule, table: TableInfo | undefined): SourceColumn[] =>
  mod.source_type === 'table' ? (table?.columns ?? []).map((c) => ({ value: c.name, label: c.name, type: c.data_type })) : [];

/** Lo que se puede mostrar, ordenar y filtrar: los campos y, según el origen, las columnas de sistema o las reales. */
export function fieldChoices(mod: EditorModule, sourceColumns: SourceColumn[]): Choice[] {
  const fields = mod.fields.filter((f) => f.key).map((f) => ({ value: f.key, label: f.label || f.key }));
  if (mod.source_type === 'records') {
    return [...fields, ...Object.entries(SYSTEM_FIELDS).map(([value, s]) => ({ value, label: `${s.label} (sistema)` }))];
  }
  const extra = sourceColumns
    .filter((c) => !mod.fields.some((f) => f.key === c.value))
    .map((c) => ({ value: c.value, label: `${c.label} (columna)` }));
  return [...fields, ...extra];
}

/** Tipo de un campo, columna de sistema o columna real. */
export function typeOf(mod: EditorModule, sourceColumns: SourceColumn[], key: string): FieldType | ColumnDataType | undefined {
  const field = mod.fields.find((f) => f.key === key);
  if (field) return field.type;
  if (mod.source_type === 'records') return SYSTEM_FIELDS[key]?.type;
  return sourceColumns.find((c) => c.value === key)?.type;
}

const labelOf = (mod: EditorModule, key: string) => mod.fields.find((f) => f.key === key)?.label ?? SYSTEM_FIELDS[key]?.label ?? key;

/** Al elegir el campo de una columna: su encabezado y formato por defecto. */
export function columnForField(mod: EditorModule, sourceColumns: SourceColumn[], column: string): Partial<ColumnConfig> {
  const field = mod.fields.find((f) => f.key === column);
  const type = typeOf(mod, sourceColumns, column);
  return {
    column,
    headerText: labelOf(mod, column),
    data_type: field ? columnTypeFor(field.type) : ((type as ColumnDataType) ?? 'text'),
  };
}

export function newColumn(choices: Choice[]): ColumnConfig {
  return {
    column: choices[0]?.value ?? 'id',
    headerText: choices[0]?.label ?? 'ID',
    data_type: 'text',
    align: 'left',
    sortable: false,
    null_display: '—',
  };
}

export const SEARCH_ALL = '*';

/** Controles de filtro posibles para un campo (la búsqueda general solo admite texto). */
export const filterControls = (mod: EditorModule, sourceColumns: SourceColumn[], field: string): FilterControl[] =>
  field === SEARCH_ALL ? ['text'] : filterControlsFor(typeOf(mod, sourceColumns, field));

/** Al elegir el campo de un filtro: su control, etiqueta y nombre por defecto. */
export function filterForField(mod: EditorModule, sourceColumns: SourceColumn[], field: string): Partial<FilterConfig> {
  if (field === SEARCH_ALL) return { field, control: 'text', label: 'Buscar', name: 'buscar' };
  return { field, control: filterControls(mod, sourceColumns, field)[0], label: labelOf(mod, field), name: field };
}

export function newFilter(filters: FilterConfig[]): FilterConfig {
  const name = filters.some((f) => f.name === 'buscar') ? `filtro_${filters.length + 1}` : 'buscar';
  return { name, label: 'Buscar', field: SEARCH_ALL, control: 'text' };
}

/** En módulos de tabla, la clave de un campo es una columna (sin repetir la clave primaria salvo que ya sea ese campo). */
export const tableColumnChoices = (sourceColumns: SourceColumn[], pk: string | null, fieldKey: string): Choice[] =>
  sourceColumns.filter((c) => c.value !== pk || c.value === fieldKey).map((c) => ({ value: c.value, label: c.label }));

/** Módulos a los que puede apuntar un campo de relación (no consultas, no él mismo). */
export const relationTargets = (modules: EditorModule[]) =>
  modules.filter((m) => m.module_key && m.source_type !== 'query').map((m) => ({ value: m.module_key, label: m.name }));

// ─── Opciones fijas de los selectores ────────────────────────────────────────

export const ALIGN_OPTIONS = [
  { value: 'left', label: 'Izquierda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Derecha' },
];

export const DIR_OPTIONS = [
  { value: 'desc', label: 'Descendente (más nuevo primero)' },
  { value: 'asc', label: 'Ascendente' },
];

export const groupOptions = (groups: ModuleGroup[]) => [
  { value: '0', label: 'Sin grupo' },
  ...groups.map((g) => ({ value: String(g.id), label: g.name })),
];

/** Celda de la muestra de una consulta. */
export function previewCell(v: unknown) {
  if (v === null || v === undefined) return '—';
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
}

/** Qué se borra con el módulo: sus registros (si son del panel) o nada de la base. */
export function deleteNotice(sourceType: SourceType, recordCount: number) {
  return sourceType === 'records'
    ? {
        card: `Se borran el módulo y sus ${recordCount} registro(s). Si solo quieres ocultarlo, desactívalo en General.`,
        confirm: `Se borrarán también sus ${recordCount} registro(s). No se puede deshacer.`,
      }
    : {
        card: 'Se borra el módulo del panel. La tabla o los datos de la base no se tocan.',
        confirm: 'Solo se quita del panel; la base de datos no cambia.',
      };
}
