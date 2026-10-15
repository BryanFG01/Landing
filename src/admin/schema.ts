// Contrato de los módulos del admin: lo comparten el servidor (valida y construye el SQL) y el navegador (pinta el
// formulario, la tabla y los filtros). Todo lo que se configura de un módulo pasa por aquí antes de llegar a la base.

export const SLUG_RE = /^[a-z][a-z0-9_]{1,47}$/;

// ─── Campos (formulario) ─────────────────────────────────────────────────────

export const FIELD_TYPES = {
  text: 'Texto corto',
  textarea: 'Texto largo',
  number: 'Número',
  currency: 'Moneda',
  email: 'Correo',
  url: 'Enlace',
  phone: 'Teléfono',
  date: 'Fecha',
  boolean: 'Sí / No',
  select: 'Lista (una opción)',
  multiselect: 'Lista (varias opciones)',
  relation: 'Registro de otro módulo',
} as const;

export type FieldType = keyof typeof FIELD_TYPES;

export interface Option {
  label: string;
  value: string;
}

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  /** select / multiselect */
  options?: Option[];
  /** number / currency */
  min?: number;
  max?: number;
  /** text / textarea */
  max_length?: number;
  /** relation: módulo del que salen las opciones y campo que se muestra como etiqueta */
  relation_module?: string;
  relation_label?: string;
}

// ─── Columnas (tabla) ────────────────────────────────────────────────────────

export const COLUMN_TYPES = {
  text: 'Texto',
  number: 'Número',
  currency: 'Moneda',
  date: 'Fecha',
  datetime: 'Fecha y hora',
  boolean: 'Sí / No',
  badge: 'Etiqueta',
  list: 'Lista',
} as const;

export type ColumnDataType = keyof typeof COLUMN_TYPES;

/** Mismos nombres que columnConfigs en el contrato de reportería de ERPCloud. */
export interface ColumnConfig {
  column: string;
  headerText: string;
  data_type: ColumnDataType;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  null_display?: string;
}

// ─── Filtros ─────────────────────────────────────────────────────────────────

export const FILTER_CONTROLS = {
  text: 'Texto (contiene)',
  select: 'Lista (una)',
  multiselect: 'Lista (varias)',
  date: 'Fecha exacta',
  daterange: 'Rango de fechas',
  number: 'Número',
  boolean: 'Solo los marcados',
} as const;

export type FilterControl = keyof typeof FILTER_CONTROLS;

export const NUMBER_OPERATORS = { eq: 'Igual a', gte: 'Mayor o igual', lte: 'Menor o igual' } as const;
export type NumberOperator = keyof typeof NUMBER_OPERATORS;

export interface FilterConfig {
  /** Nombre del parámetro en la consulta (y clave en los valores del filtro). */
  name: string;
  label: string;
  /** Campo sobre el que filtra. `*` busca en todos los campos de texto. */
  field: string;
  control: FilterControl;
  operator?: NumberOperator;
  placeholder?: string;
}

// ─── Campos de sistema ───────────────────────────────────────────────────────

export const SYSTEM_FIELDS: Record<string, { label: string; type: ColumnDataType }> = {
  id: { label: 'ID', type: 'number' },
  created_at: { label: 'Creado', type: 'datetime' },
  updated_at: { label: 'Actualizado', type: 'datetime' },
};

export const ICONS = [
  'squares',
  'package',
  'tag',
  'shopping-cart',
  'users',
  'user',
  'truck',
  'calendar',
  'chart',
  'file',
  'folder',
  'gear',
  'egg',
  'storefront',
  'chat',
  'star',
  'money',
  'map-pin',
] as const;

export type IconName = (typeof ICONS)[number];

// ─── Definición de un módulo ─────────────────────────────────────────────────

export interface ModuleDefinition {
  id?: number;
  module_key: string;
  name: string;
  description?: string | null;
  group_id: number | null;
  icon?: string | null;
  sort_order: number;
  fields: FieldConfig[];
  column_configs: ColumnConfig[];
  filters: FilterConfig[];
  default_sort: string;
  default_dir: 'asc' | 'desc';
  page_size: number;
  is_active: boolean;
}

export interface ModuleGroup {
  id: number;
  name: string;
  sort_order: number;
}

export interface NavModule {
  id: number;
  module_key: string;
  name: string;
  icon: string | null;
  group_id: number | null;
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
}

export type RecordRow = { id: number; created_at: string; updated_at: string } & Record<string, unknown>;

export interface RecordsPage {
  type: 'table';
  columnConfigs: ColumnConfig[];
  data: RecordRow[];
  page: number;
  page_size: number;
  total_rows: number;
}

/** Qué controles de filtro tienen sentido para cada tipo de campo. */
export function filterControlsFor(type: FieldType | ColumnDataType | undefined): FilterControl[] {
  switch (type) {
    case 'number':
    case 'currency':
      return ['number'];
    case 'date':
    case 'datetime':
      return ['daterange', 'date'];
    case 'boolean':
      return ['boolean'];
    case 'select':
    case 'relation':
      return ['select', 'multiselect'];
    case 'multiselect':
      return ['multiselect', 'select'];
    default:
      return ['text'];
  }
}

/** Tipo de columna por defecto para un campo. */
export function columnTypeFor(type: FieldType): ColumnDataType {
  switch (type) {
    case 'number':
      return 'number';
    case 'currency':
      return 'currency';
    case 'date':
      return 'date';
    case 'boolean':
      return 'boolean';
    case 'select':
    case 'relation':
      return 'badge';
    case 'multiselect':
      return 'list';
    default:
      return 'text';
  }
}

// ─── Validación de la definición ─────────────────────────────────────────────

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const pick = <T extends string>(v: unknown, allowed: Record<T, unknown>, fallback?: T) =>
  typeof v === 'string' && v in allowed ? (v as T) : fallback;

/** Limpia y valida lo que llega del constructor de módulos. Devuelve la definición o la lista de errores. */
export function parseModuleDefinition(
  input: unknown,
): { ok: true; value: ModuleDefinition } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const raw = (input ?? {}) as Record<string, unknown>;

  const module_key = str(raw.module_key);
  if (!SLUG_RE.test(module_key)) {
    errors.push('La clave del módulo debe empezar por letra y usar solo minúsculas, números y guion bajo (2 a 48).');
  }
  const name = str(raw.name);
  if (!name) errors.push('El módulo necesita un nombre.');

  // Campos
  const fields: FieldConfig[] = [];
  const seen = new Set<string>();
  for (const [i, f] of (Array.isArray(raw.fields) ? raw.fields : []).entries()) {
    const r = (f ?? {}) as Record<string, unknown>;
    const key = str(r.key);
    const label = str(r.label) || key;
    const type = pick(r.type, FIELD_TYPES);
    const where = `Campo ${i + 1}${label ? ` (${label})` : ''}`;
    if (!SLUG_RE.test(key)) {
      errors.push(`${where}: la clave debe empezar por letra y usar solo minúsculas, números y guion bajo (2 a 48).`);
    }
    else if (key in SYSTEM_FIELDS) errors.push(`${where}: "${key}" es un campo de sistema.`);
    else if (seen.has(key)) errors.push(`${where}: la clave "${key}" está repetida.`);
    seen.add(key);
    if (!type) {
      errors.push(`${where}: tipo no válido.`);
      continue;
    }
    const field: FieldConfig = { key, label, type, required: r.required === true };
    if (str(r.placeholder)) field.placeholder = str(r.placeholder);
    if (str(r.help)) field.help = str(r.help);
    if (type === 'select' || type === 'multiselect') {
      const options = (Array.isArray(r.options) ? r.options : [])
        .map((o) => {
          const ro = (o ?? {}) as Record<string, unknown>;
          const value = str(ro.value);
          return { value, label: str(ro.label) || value };
        })
        .filter((o) => o.value);
      if (!options.length) errors.push(`${where}: añade al menos una opción.`);
      if (new Set(options.map((o) => o.value)).size !== options.length) errors.push(`${where}: hay opciones repetidas.`);
      field.options = options;
    }
    if (type === 'number' || type === 'currency') {
      if (typeof r.min === 'number' && Number.isFinite(r.min)) field.min = r.min;
      if (typeof r.max === 'number' && Number.isFinite(r.max)) field.max = r.max;
    }
    if ((type === 'text' || type === 'textarea') && typeof r.max_length === 'number' && r.max_length > 0) {
      field.max_length = Math.floor(r.max_length);
    }
    if (type === 'relation') {
      field.relation_module = str(r.relation_module);
      field.relation_label = str(r.relation_label);
      if (!SLUG_RE.test(field.relation_module)) errors.push(`${where}: elige el módulo relacionado.`);
      if (!SLUG_RE.test(field.relation_label)) errors.push(`${where}: elige qué campo del otro módulo se muestra.`);
      if (field.relation_module === module_key) errors.push(`${where}: un módulo no puede relacionarse consigo mismo.`);
    }
    fields.push(field);
  }
  if (!fields.length) errors.push('Añade al menos un campo.');

  const known = new Map<string, FieldType | ColumnDataType>([
    ...fields.map((f) => [f.key, f.type] as const),
    ...Object.entries(SYSTEM_FIELDS).map(([k, v]) => [k, v.type] as const),
  ]);

  // Columnas
  const column_configs: ColumnConfig[] = [];
  for (const [i, c] of (Array.isArray(raw.column_configs) ? raw.column_configs : []).entries()) {
    const r = (c ?? {}) as Record<string, unknown>;
    const column = str(r.column);
    if (!known.has(column)) {
      errors.push(`Columna ${i + 1}: el campo "${column}" no existe.`);
      continue;
    }
    column_configs.push({
      column,
      headerText: str(r.headerText) || fields.find((f) => f.key === column)?.label || SYSTEM_FIELDS[column]?.label || column,
      data_type: pick(r.data_type, COLUMN_TYPES, 'text')!,
      align: pick(r.align, { left: 1, center: 1, right: 1 }, 'left'),
      sortable: r.sortable === true,
      null_display: typeof r.null_display === 'string' ? r.null_display : '—',
    });
  }
  if (!column_configs.length) errors.push('Añade al menos una columna a la tabla.');

  // Filtros
  const filters: FilterConfig[] = [];
  const names = new Set<string>();
  for (const [i, fl] of (Array.isArray(raw.filters) ? raw.filters : []).entries()) {
    const r = (fl ?? {}) as Record<string, unknown>;
    const field = str(r.field);
    const control = pick(r.control, FILTER_CONTROLS);
    const name = str(r.name) || (field === '*' ? 'buscar' : field);
    const where = `Filtro ${i + 1}`;
    if (field !== '*' && !known.has(field)) {
      errors.push(`${where}: el campo "${field}" no existe.`);
      continue;
    }
    if (!control) {
      errors.push(`${where}: control no válido.`);
      continue;
    }
    if (field === '*' && control !== 'text') errors.push(`${where}: la búsqueda general solo admite control de texto.`);
    if (field !== '*' && !filterControlsFor(known.get(field)).includes(control)) {
      errors.push(`${where}: el control "${FILTER_CONTROLS[control]}" no sirve para ese campo.`);
    }
    if (!SLUG_RE.test(name) || names.has(name)) errors.push(`${where}: nombre "${name}" no válido o repetido.`);
    names.add(name);
    const filter: FilterConfig = { name, label: str(r.label) || name, field, control };
    if (control === 'number') filter.operator = pick(r.operator, NUMBER_OPERATORS, 'eq');
    if (str(r.placeholder)) filter.placeholder = str(r.placeholder);
    filters.push(filter);
  }

  const default_sort = known.has(str(raw.default_sort)) ? str(raw.default_sort) : 'created_at';
  const default_dir = raw.default_dir === 'asc' ? 'asc' : 'desc';
  const page_size = Math.min(100, Math.max(5, Math.floor(Number(raw.page_size) || 20)));
  const group_id = Number.isInteger(raw.group_id) && (raw.group_id as number) > 0 ? (raw.group_id as number) : null;

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      module_key,
      name,
      description: str(raw.description) || null,
      group_id,
      icon: pick(raw.icon, Object.fromEntries(ICONS.map((i) => [i, 1])) as Record<IconName, number>) ?? null,
      sort_order: Math.floor(Number(raw.sort_order) || 0),
      fields,
      column_configs,
      filters,
      default_sort,
      default_dir,
      page_size,
      is_active: raw.is_active !== false,
    },
  };
}

// ─── Validación de un registro ───────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isEmpty = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

/**
 * Normaliza los datos de un registro según los campos del módulo. Descarta claves desconocidas.
 * Las relaciones solo se comprueban por forma aquí; que el registro exista lo valida el servidor.
 */
export function parseRecordData(
  fields: FieldConfig[],
  input: unknown,
): { ok: true; value: Record<string, unknown> } | { ok: false; errors: Record<string, string> } {
  const raw = (input ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const f of fields) {
    let v = raw[f.key];
    if (typeof v === 'string') v = v.trim();
    if (isEmpty(v)) {
      if (f.type === 'boolean') out[f.key] = false;
      else if (f.required) errors[f.key] = 'Obligatorio.';
      continue;
    }

    switch (f.type) {
      case 'text':
      case 'textarea':
      case 'phone': {
        const s = String(v);
        if (f.max_length && s.length > f.max_length) errors[f.key] = `Máximo ${f.max_length} caracteres.`;
        else out[f.key] = s;
        break;
      }
      case 'email':
        if (!EMAIL_RE.test(String(v))) errors[f.key] = 'Correo no válido.';
        else out[f.key] = String(v).toLowerCase();
        break;
      case 'url':
        try {
          const u = new URL(String(v));
          if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error();
          out[f.key] = u.href;
        } catch {
          errors[f.key] = 'Enlace no válido (http o https).';
        }
        break;
      case 'number':
      case 'currency': {
        const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
        if (!Number.isFinite(n)) errors[f.key] = 'Número no válido.';
        else if (f.min !== undefined && n < f.min) errors[f.key] = `Mínimo ${f.min}.`;
        else if (f.max !== undefined && n > f.max) errors[f.key] = `Máximo ${f.max}.`;
        else out[f.key] = n;
        break;
      }
      case 'date':
        if (!DATE_RE.test(String(v)) || Number.isNaN(Date.parse(String(v)))) errors[f.key] = 'Fecha no válida.';
        else out[f.key] = String(v);
        break;
      case 'boolean':
        out[f.key] = v === true || v === 'true' || v === 1 || v === '1';
        break;
      case 'select':
        if (!f.options?.some((o) => o.value === String(v))) errors[f.key] = 'Opción no válida.';
        else out[f.key] = String(v);
        break;
      case 'multiselect': {
        const arr = (Array.isArray(v) ? v : [v]).map(String);
        if (!arr.every((x) => f.options?.some((o) => o.value === x))) errors[f.key] = 'Hay opciones no válidas.';
        else out[f.key] = [...new Set(arr)];
        break;
      }
      case 'relation': {
        const id = Number(v);
        if (!Number.isInteger(id) || id <= 0) errors[f.key] = 'Selección no válida.';
        else out[f.key] = id;
        break;
      }
    }
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: out };
}
