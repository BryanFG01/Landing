// Contrato de los módulos del admin: lo comparten el servidor (valida y construye el SQL) y el navegador (pinta el
// formulario, la tabla y los filtros). Todo lo que se configura de un módulo pasa por aquí antes de llegar a la base.

import type { SalesStats } from './sales';

export const SLUG_RE = /^[a-z][a-z0-9_]{1,47}$/;
/** Nombre de tabla o columna de PostgreSQL sin comillas (minúsculas). */
export const IDENT_RE = /^[a-z_][a-z0-9_]{0,62}$/;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// ─── Origen de los datos ─────────────────────────────────────────────────────

export const SOURCE_TYPES = {
  records: 'Registros del panel',
  table: 'Tabla de la base de datos',
  query: 'Consulta SQL (solo lectura)',
} as const;

export type SourceType = keyof typeof SOURCE_TYPES;

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
  image: 'Foto',
  file: 'Archivo adjunto',
} as const;

export type FieldType = keyof typeof FIELD_TYPES;

/** Lo que se guarda en un campo de foto o archivo. El contenido está en admin.files. */
export interface FileRef {
  id: string;
  name: string;
  mime: string;
  size: number;
}

export const fileUrl = (ref: FileRef) => `/api/admin/files/${ref.id}`;

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
  image: 'Foto',
  file: 'Archivo',
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
  'table',
  'database',
  'image',
] as const;

export type IconName = (typeof ICONS)[number];

// ─── Definición de un módulo ─────────────────────────────────────────────────

export interface ModuleDefinition {
  id?: number;
  module_key: string;
  /** records: admin.records (jsonb). table: tabla real del esquema datos. query: SELECT de solo lectura. */
  source_type: SourceType;
  /** table: nombre de la tabla. query: el SQL. */
  source: string | null;
  /** table: columna clave primaria. */
  source_pk: string | null;
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
  /** Registros con estado "pendiente" (módulos con un campo de lista "estado"), para el contador del menú. */
  pending: number;
}

/** ¿El módulo lleva estados con "pendiente"? (pedidos y similares: el menú cuenta los pendientes). */
export const hasPendingState = (fields: FieldConfig[]) =>
  fields.some((f) => f.key === 'estado' && f.type === 'select' && f.options?.some((o) => o.value === 'pendiente'));

export const ROLES = {
  admin: 'Administrador (todo el panel)',
  usuario: 'Usuario (solo los módulos asignados)',
} as const;

export type Role = keyof typeof ROLES;

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: Role;
}

/** none: no lo ve. view: ver y exportar. edit: además crear, editar, borrar e importar. */
export type ModuleAccess = 'none' | 'view' | 'edit';

/** Una fila de cualquier origen. `__id` identifica la fila (id del registro o valor de la clave de la tabla). */
export type RecordRow = { __id: string | number } & Record<string, unknown>;

/** Resumen del inicio del panel (solo con los módulos que el usuario puede ver). */
export interface DashboardStats {
  modules: {
    module_key: string;
    name: string;
    icon: string | null;
    description: string | null;
    source_type: string;
    /** Null en consultas (no se cuentan) o si la tabla no está disponible. */
    records: number | null;
  }[];
  totalRecords: number;
  /** Solo para administradores. */
  admins: number | null;
  recent: { action: string; created_at: string; user: string | null; module: string | null; record_id: number | null }[];
  /** Pedidos de la web (solo si se puede ver ese módulo). */
  sales: SalesStats | null;
}

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
    case 'image':
      return 'image';
    case 'file':
      return 'file';
    default:
      return 'text';
  }
}

// ─── Validación de la definición ─────────────────────────────────────────────

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const pick = <T extends string>(v: unknown, allowed: Record<T, unknown>, fallback?: T) =>
  typeof v === 'string' && v in allowed ? (v as T) : fallback;

/** SQL de un módulo de consulta: un solo SELECT (o WITH), sin punto y coma intermedio. */
export function cleanQuerySql(sql: string) {
  return sql.trim().replace(/;\s*$/, '').trim();
}

/**
 * Limpia y valida lo que llega del constructor de módulos. Devuelve la definición o la lista de errores.
 * `columns`: en módulos de tabla o consulta, las columnas reales (las comprueba el servidor contra la base).
 */
export function parseModuleDefinition(
  input: unknown,
  ctx: { columns?: Map<string, ColumnDataType> } = {},
): { ok: true; value: ModuleDefinition } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const raw = (input ?? {}) as Record<string, unknown>;
  const source_type = pick<SourceType>(raw.source_type, SOURCE_TYPES, 'records')!;
  const isRecords = source_type === 'records';
  // En tablas y consultas las claves son nombres de columna de PostgreSQL.
  const keyRe = isRecords ? SLUG_RE : IDENT_RE;
  const keyRule = isRecords
    ? 'debe empezar por letra y usar solo minúsculas, números y guion bajo (2 a 48)'
    : 'debe ser un nombre de columna en minúsculas (letras, números y guion bajo)';

  const module_key = str(raw.module_key);
  if (!SLUG_RE.test(module_key)) {
    errors.push('La clave del módulo debe empezar por letra y usar solo minúsculas, números y guion bajo (2 a 48).');
  }
  const name = str(raw.name);
  if (!name) errors.push('El módulo necesita un nombre.');

  // Origen
  let source: string | null = null;
  let source_pk: string | null = null;
  if (source_type === 'table') {
    source = str(raw.source);
    source_pk = str(raw.source_pk);
    if (!IDENT_RE.test(source)) errors.push('Elige la tabla de la base de datos.');
    if (!IDENT_RE.test(source_pk)) errors.push('La tabla necesita una clave primaria de una sola columna.');
  } else if (source_type === 'query') {
    source = cleanQuerySql(typeof raw.source === 'string' ? raw.source : '');
    if (!/^(select|with)\b/i.test(source)) errors.push('La consulta debe empezar por SELECT o WITH.');
    else if (source.includes(';')) errors.push('La consulta debe ser una sola sentencia (sin punto y coma).');
    if (source.length > 20_000) errors.push('La consulta es demasiado larga.');
  }

  // Campos
  const fields: FieldConfig[] = [];
  const seen = new Set<string>();
  for (const [i, f] of (Array.isArray(raw.fields) ? raw.fields : []).entries()) {
    const r = (f ?? {}) as Record<string, unknown>;
    const key = str(r.key);
    const label = str(r.label) || key;
    const type = pick(r.type, FIELD_TYPES);
    const where = `Campo ${i + 1}${label ? ` (${label})` : ''}`;
    if (!keyRe.test(key)) errors.push(`${where}: la clave ${keyRule}.`);
    else if (isRecords && key in SYSTEM_FIELDS) errors.push(`${where}: "${key}" es un campo de sistema.`);
    else if (seen.has(key)) errors.push(`${where}: la clave "${key}" está repetida.`);
    else if (!isRecords && ctx.columns && !ctx.columns.has(key)) {
      errors.push(`${where}: la columna "${key}" no existe en ${source_type === 'table' ? 'la tabla' : 'la consulta'}.`);
    }
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
      if (!IDENT_RE.test(field.relation_label)) errors.push(`${where}: elige qué campo del otro módulo se muestra.`);
      if (field.relation_module === module_key) errors.push(`${where}: un módulo no puede relacionarse consigo mismo.`);
      if (source_type === 'query') errors.push(`${where}: las consultas no tienen campos de relación.`);
    }
    fields.push(field);
  }
  if (!fields.length) {
    errors.push(
      source_type === 'query'
        ? 'Prueba la consulta para detectar sus columnas.'
        : source_type === 'table'
          ? 'Trae las columnas de la tabla o añade al menos un campo.'
          : 'Añade al menos un campo.',
    );
  }

  // Lo que se puede mostrar, ordenar y filtrar: los campos y, según el origen, las columnas de sistema o las reales.
  const known = new Map<string, FieldType | ColumnDataType>([
    ...(isRecords ? Object.entries(SYSTEM_FIELDS).map(([k, v]) => [k, v.type] as const) : []),
    ...(ctx.columns ? [...ctx.columns] : []),
    ...(source_pk && !ctx.columns ? [[source_pk, 'number'] as const] : []),
    ...fields.map((f) => [f.key, f.type] as const),
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
      align: pick<NonNullable<ColumnConfig['align']>>(r.align, { left: 1, center: 1, right: 1 }, 'left'),
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
    if (!IDENT_RE.test(name) || names.has(name)) errors.push(`${where}: nombre "${name}" no válido o repetido.`);
    names.add(name);
    const filter: FilterConfig = { name, label: str(r.label) || name, field, control };
    if (control === 'number') filter.operator = pick(r.operator, NUMBER_OPERATORS, 'eq');
    if (str(r.placeholder)) filter.placeholder = str(r.placeholder);
    filters.push(filter);
  }

  const fallbackSort = isRecords ? 'created_at' : (source_pk ?? column_configs[0]?.column ?? fields[0]?.key ?? '');
  const default_sort = known.has(str(raw.default_sort)) ? str(raw.default_sort) : fallbackSort;
  const default_dir = raw.default_dir === 'asc' ? 'asc' : 'desc';
  const page_size = Math.min(100, Math.max(5, Math.floor(Number(raw.page_size) || 20)));
  const group_id = Number.isInteger(raw.group_id) && (raw.group_id as number) > 0 ? (raw.group_id as number) : null;

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      module_key,
      source_type,
      source,
      source_pk,
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
        // Id numérico (registros, claves enteras) o texto (tablas con clave de texto).
        const s = String(v).trim();
        if (/^\d+$/.test(s) && Number(s) > 0) out[f.key] = Number(s);
        else if (s && s.length <= 200 && typeof v !== 'object') out[f.key] = s;
        else errors[f.key] = 'Selección no válida.';
        break;
      }
      case 'image':
      case 'file': {
        const ref = parseFileRef(v);
        if (!ref) errors[f.key] = 'Archivo no válido.';
        else if (f.type === 'image' && !ref.mime.startsWith('image/')) errors[f.key] = 'Debe ser una imagen.';
        else out[f.key] = ref;
        break;
      }
    }
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: out };
}

export function parseFileRef(v: unknown): FileRef | null {
  const r = (v ?? {}) as Record<string, unknown>;
  if (typeof v !== 'object' || typeof r.id !== 'string' || !UUID_RE.test(r.id)) return null;
  return {
    id: r.id,
    name: typeof r.name === 'string' ? r.name.slice(0, 200) : 'archivo',
    mime: typeof r.mime === 'string' ? r.mime.slice(0, 100) : 'application/octet-stream',
    size: Number(r.size) || 0,
  };
}

// ─── Apariencia del panel ────────────────────────────────────────────────────

export interface Appearance {
  /** Nombre en el menú lateral y en el login. */
  name: string;
  /** Texto pequeño bajo el nombre. */
  subtitle: string;
  /** Logo como data URL (se reduce en el navegador antes de guardarlo). Vacío: el logo de la web. */
  logo: string;
  /** Color principal (botones, enlaces, activo del menú), en hex. */
  primary: string;
  /** Color principal en modo oscuro. Vacío: se calcula a partir del principal. */
  primary_dark: string;
  /** Redondeo de las esquinas, en rem. */
  radius: number;
  /** Tema por defecto si la persona no ha elegido uno. */
  theme: 'auto' | 'light' | 'dark';
  /** 'web': colores, esquinas y tipografías salen de la plantilla publicada en Sitio web. 'propios': los de aquí. */
  colores: 'web' | 'propios';
  /** Login: título y frase sobre la foto. */
  login_title: string;
  login_text: string;
  /** Login: foto de fondo subida desde el panel ("/media/<id>"). Vacío: la foto de siempre (la báscula). */
  login_image: string;
}

export const DEFAULT_APPEARANCE: Appearance = {
  name: 'El Agropecuario',
  subtitle: 'Administración',
  logo: '',
  primary: '#b7571f',
  primary_dark: '',
  radius: 0.625,
  theme: 'auto',
  colores: 'web',
  login_title: 'Del campo a tu mesa',
  login_text: 'Gestiona productos, pedidos y todo lo que se ve en la web desde un solo lugar.',
  login_image: '',
};

export const RADIUS_OPTIONS = [
  { value: '0', label: 'Rectas' },
  { value: '0.375', label: 'Suaves' },
  { value: '0.625', label: 'Redondeadas' },
  { value: '1', label: 'Muy redondeadas' },
];

const HEX_RE = /^#[0-9a-f]{6}$/i;
const LOGO_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
// La foto del login se sube como imagen pública (se ve sin sesión) — nunca una URL externa cualquiera.
const MEDIA_PREFIX = '/media/';
const isMediaRef = (s: string) => s.startsWith(MEDIA_PREFIX) && UUID_RE.test(s.slice(MEDIA_PREFIX.length));
export const LOGO_MAX = 300_000;

export function parseAppearance(input: unknown): { ok: true; value: Appearance } | { ok: false; errors: string[] } {
  const raw = (input ?? {}) as Record<string, unknown>;
  const d = DEFAULT_APPEARANCE;
  const errors: string[] = [];
  const text = (k: keyof Appearance, max: number) => {
    const v = str(raw[k]);
    if (v.length > max) errors.push(`"${k}" admite como mucho ${max} caracteres.`);
    return v;
  };
  const value: Appearance = {
    name: text('name', 40) || d.name,
    subtitle: text('subtitle', 40),
    logo: str(raw.logo),
    primary: str(raw.primary) || d.primary,
    primary_dark: str(raw.primary_dark),
    radius: RADIUS_OPTIONS.some((o) => Number(o.value) === Number(raw.radius)) ? Number(raw.radius) : d.radius,
    theme: pick<Appearance['theme']>(raw.theme, { auto: 1, light: 1, dark: 1 }, 'auto')!,
    colores: pick<Appearance['colores']>(raw.colores, { web: 1, propios: 1 }, d.colores)!,
    login_title: text('login_title', 60) || d.login_title,
    login_text: text('login_text', 200),
    login_image: str(raw.login_image),
  };
  if (!HEX_RE.test(value.primary)) errors.push('El color principal debe ser un color hex, por ejemplo #b7571f.');
  if (value.primary_dark && !HEX_RE.test(value.primary_dark)) errors.push('El color para modo oscuro no es válido.');
  if (value.logo && (!LOGO_RE.test(value.logo) || value.logo.length > LOGO_MAX)) {
    errors.push('El logo debe ser una imagen PNG, JPG o WebP pequeña.');
  }
  if (value.login_image && !isMediaRef(value.login_image)) {
    errors.push('La foto del login debe subirse desde el panel.');
  }
  return errors.length ? { ok: false, errors } : { ok: true, value };
}

/** "#b7571f" → [h, s, l] (grados y porcentajes). */
export function hexToHsl(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const dlt = max - min;
  const s = l > 0.5 ? dlt / (2 - max - min) : dlt / (max + min);
  let h = max === r ? (g - b) / dlt + (g < b ? 6 : 0) : max === g ? (b - r) / dlt + 2 : (r - g) / dlt + 4;
  h *= 60;
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

/** Luminancia relativa (WCAG) de un color HSL. */
function luminance([h, s, l]: [number, number, number]) {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(0) + 0.7152 * f(8) + 0.0722 * f(4);
}

const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** Texto encima del color: blanco si se lee bien (≥ 4.5:1), si no, casi negro. */
function foregroundFor(hsl: [number, number, number]) {
  return contrast(luminance(hsl), 1) >= 4.5 ? '0 0% 100%' : '150 35% 7%';
}

const hslVar = ([h, s, l]: [number, number, number]) => `${h} ${s}% ${l}%`;

/** Mezcla dos colores hex: `t` = 0 da `a`, 1 da `b`. */
function mixHex(a: string, b: string, t: number) {
  const ch = (hex: string) => [16, 8, 0].map((s) => (Number.parseInt(hex.slice(1), 16) >> s) & 255);
  const [x, y] = [ch(a), ch(b)];
  return `#${x.map((c, i) => Math.round(c + (y[i] - c) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** Colores de la web que usa el login (los de la plantilla publicada). */
export interface LoginTheme {
  fondo: string;
  texto: string;
  acento: string;
  textoBoton: string;
}

/** ¿Fondo claro? Decide si el login va en modo claro u oscuro. */
export const isLightTheme = (t: LoginTheme) => HEX_RE.test(t.fondo) && luminance(hexToHsl(t.fondo)) > 0.4;

/**
 * Variables CSS del login a partir de los colores de la web: fondo, texto, acento y texto de botones. Van después de
 * las de Apariencia y con más especificidad, así el login se ve como la plantilla publicada y el resto del panel no cambia.
 */
export function loginThemeCss(t: LoginTheme) {
  if (![t.fondo, t.texto, t.acento, t.textoBoton].every((c) => HEX_RE.test(c))) return '';
  const v = (hex: string) => hslVar(hexToHsl(hex));
  const vars = {
    '--background': v(t.fondo),
    '--foreground': v(t.texto),
    '--muted': v(mixHex(t.fondo, t.texto, 0.08)),
    '--muted-foreground': v(mixHex(t.fondo, t.texto, 0.68)),
    '--border': v(mixHex(t.fondo, t.texto, 0.18)),
    '--primary': v(t.acento),
    '--ring': v(t.acento),
    '--primary-foreground': v(t.textoBoton),
  };
  const body = Object.entries(vars)
    .map(([k, val]) => `${k}:${val}`)
    .join(';');
  return `html:root,html:root.dark{${body}}`;
}

/** Lo que el panel toma de la plantilla publicada en la web (Sitio web → Colores y tipografía). */
export interface PanelSiteTheme {
  fondo: string;
  texto: string;
  acento: string;
  titulos: string;
  cuerpo: string;
  pesoTitulos: string;
  tarjetas: string;
}

/** Esquinas del panel según las tarjetas de la plantilla (las de "Finca" dan las de siempre). */
const RADIUS_BY_CARDS: Record<string, number> = { grandes: 0.625, medias: 0.625, suaves: 0.375, rectas: 0 };

type Hsl = [number, number, number];

/** El mismo tono, oscurecido hasta que el texto blanco encima se lea (≥ 4.5:1). */
function darkenForWhite([h, s, l]: Hsl): Hsl {
  let light = l;
  while (light > 5 && contrast(luminance([h, s, light]), 1) < 4.5) light -= 1;
  return [h, s, light];
}

/** El panel en modo oscuro: el acento más claro para que destaque sobre el fondo oscuro. */
const lightenForDark = ([h, s, l]: Hsl): Hsl => [h, Math.min(s, 70), Math.min(Math.max(l + 10, 50), 65)];

const tint = ([h, s]: Hsl, maxSat: number, light: number) => `${h} ${Math.min(s, maxSat)}% ${light}%`;

/**
 * Colores del panel a partir de la plantilla de la web: los fondos y bordes toman el tono del color claro de la
 * plantilla; los textos, el del color oscuro; y el principal, el acento. Las luminosidades son las de admin.css, así
 * el contraste no cambia (con la plantilla "Finca" sale exactamente el panel de siempre).
 */
function siteThemeVars(site: PanelSiteTheme) {
  const [a, b] = [hexToHsl(site.fondo), hexToHsl(site.texto)];
  const [clear, ink] = luminance(a) >= luminance(b) ? [a, b] : [b, a];
  const primary = darkenForWhite(hexToHsl(site.acento));
  const primaryDark = lightenForDark(primary);
  const light = {
    '--background': tint(clear, 45, 98),
    '--foreground': tint(ink, 27, 14),
    '--muted': tint(clear, 32, 93),
    '--muted-foreground': tint(ink, 9, 38),
    '--border': tint(clear, 24, 85),
    '--primary': hslVar(primary),
    '--ring': hslVar(primary),
    '--primary-foreground': foregroundFor(primary),
    '--radius': `${RADIUS_BY_CARDS[site.tarjetas] ?? 0.625}rem`,
  };
  const dark = {
    '--background': tint(ink, 28, 9),
    '--foreground': tint(clear, 50, 91),
    '--muted': tint(ink, 22, 15),
    '--muted-foreground': tint(clear, 14, 66),
    '--border': tint(ink, 18, 20),
    '--primary': hslVar(primaryDark),
    '--ring': hslVar(primaryDark),
    '--primary-foreground': foregroundFor(primaryDark),
  };
  return { light, dark };
}

const cssBlock = (selector: string, vars: Record<string, string>) =>
  `${selector}{${Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')}}`;

/** ¿El panel sigue a la plantilla de la web? Solo si así está en Apariencia y la plantilla tiene colores válidos. */
export const followsSite = (a: Appearance, site: PanelSiteTheme | null): site is PanelSiteTheme =>
  a.colores === 'web' && !!site && [site.fondo, site.texto, site.acento].every((c) => HEX_RE.test(c));

/** Variables CSS del panel: las de la plantilla de la web o las de Apariencia, según lo elegido. */
export function panelCss(a: Appearance, site: PanelSiteTheme | null) {
  if (!followsSite(a, site)) return appearanceCss(a);
  const { light, dark } = siteThemeVars(site);
  return cssBlock('html:root,html .light', light) + cssBlock('html.dark,html .dark', dark);
}

/** Variables CSS del tema a partir de la apariencia guardada. */
export function appearanceCss(a: Appearance) {
  const light = hexToHsl(HEX_RE.test(a.primary) ? a.primary : DEFAULT_APPEARANCE.primary);
  // Sin color propio para el modo oscuro: el mismo tono, más claro para que destaque sobre el fondo verde.
  const dark: [number, number, number] =
    a.primary_dark && HEX_RE.test(a.primary_dark)
      ? hexToHsl(a.primary_dark)
      : [light[0], Math.min(light[1], 70), Math.min(Math.max(light[2] + 10, 50), 65)];
  // Con "html" delante ganan a admin.css aunque este se cargue después.
  return (
    `html:root,html .light{--primary:${hslVar(light)};--ring:${hslVar(light)};--primary-foreground:${foregroundFor(light)};--radius:${a.radius}rem}` +
    `html.dark,html .dark{--primary:${hslVar(dark)};--ring:${hslVar(dark)};--primary-foreground:${foregroundFor(dark)}}`
  );
}
