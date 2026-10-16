// Filtros, orden y paginación comunes a todos los orígenes de datos (registros jsonb, tablas reales y consultas).
// Cada origen aporta sus expresiones SQL (Exprs); la lógica de qué condición sale de cada control vive aquí una sola
// vez. Los valores van siempre como parámetros; los nombres de columna se validan antes contra la definición o la base.

import type { FieldConfig, FilterConfig } from '../domain/schema';

export type Sql = { sql: string; params: unknown[] };

export interface Exprs {
  /** Valor como texto. */
  text(field: string): Sql;
  /** Fecha como texto YYYY-MM-DD, para comparar días. */
  date(field: string): Sql;
  /** Valor numérico. */
  number(field: string): Sql;
  /** Condición "está marcado". */
  isTrue(field: string): Sql;
  /** Condición "coincide alguna de las opciones" para campos de varias opciones. */
  anyOf(field: string, list: string[]): Sql;
  /** Condición de búsqueda general sobre todo el registro. */
  search(pattern: string): Sql;
  /** Expresión por la que ordenar. */
  sort(field: string): Sql;
}

export interface ListQuery {
  page: number;
  pageSize: number;
  sort?: string;
  dir?: 'asc' | 'desc';
  filters: Record<string, unknown>;
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

function filterCondition(filter: FilterConfig, value: unknown, type: FieldConfig['type'] | undefined, x: Exprs): Sql | null {
  if (filter.field === '*') return x.search(`%${escapeLike(String(value))}%`);

  switch (filter.control) {
    case 'text': {
      const f = x.text(filter.field);
      return { sql: `${f.sql} ILIKE ?`, params: [...f.params, `%${escapeLike(String(value))}%`] };
    }

    case 'select':
    case 'multiselect': {
      const list = (Array.isArray(value) ? value : [value]).map(String);
      // Campo de varias opciones: basta con que coincida alguna.
      if (type === 'multiselect') return x.anyOf(filter.field, list);
      const f = x.text(filter.field);
      return { sql: `${f.sql} = ANY(?::text[])`, params: [...f.params, list] };
    }

    case 'date': {
      const f = x.date(filter.field);
      return { sql: `${f.sql} = ?`, params: [...f.params, String(value).slice(0, 10)] };
    }

    case 'daterange': {
      const { from, to } = (value ?? {}) as { from?: string; to?: string };
      const f = x.date(filter.field);
      const sql: string[] = [];
      const params: unknown[] = [];
      if (from) sql.push(`${f.sql} >= ?`), params.push(...f.params, from.slice(0, 10));
      if (to) sql.push(`${f.sql} <= ?`), params.push(...f.params, to.slice(0, 10));
      return sql.length ? { sql: sql.join(' AND '), params } : null;
    }

    case 'number': {
      const n = Number(value);
      if (!Number.isFinite(n)) return null;
      const f = x.number(filter.field);
      const op = { eq: '=', gte: '>=', lte: '<=' }[filter.operator ?? 'eq'];
      return { sql: `${f.sql} ${op} ?`, params: [...f.params, n] };
    }

    case 'boolean':
      return x.isTrue(filter.field);
  }
}

/** Condiciones WHERE a partir de los valores del formulario de filtros. `base`: condición fija del origen. */
export function buildWhere(
  filters: FilterConfig[],
  fields: FieldConfig[],
  values: Record<string, unknown>,
  x: Exprs,
  base: Sql = { sql: 'TRUE', params: [] },
): Sql {
  const parts = [base.sql];
  const params = [...base.params];
  const fieldType = (key: string) => fields.find((f) => f.key === key)?.type;

  for (const filter of filters) {
    const value = values[filter.name];
    if (value === undefined || value === null || value === '' || value === false) continue;
    if (Array.isArray(value) && !value.length) continue;
    const cond = filterCondition(filter, value, fieldType(filter.field), x);
    if (cond) {
      parts.push(`(${cond.sql})`);
      params.push(...cond.params);
    }
  }
  return { sql: parts.join(' AND '), params };
}

/** Orden: solo columnas marcadas como ordenables o el orden por defecto del módulo. */
export function buildOrder(
  mod: { default_sort: string; default_dir: 'asc' | 'desc'; column_configs: { column: string; sortable?: boolean }[] },
  q: Pick<ListQuery, 'sort' | 'dir'>,
  x: Exprs,
): Sql & { dir: 'ASC' | 'DESC' } {
  const sortable = new Set([mod.default_sort, ...mod.column_configs.filter((c) => c.sortable).map((c) => c.column)]);
  const valid = q.sort && sortable.has(q.sort);
  const order = x.sort(valid ? q.sort! : mod.default_sort);
  return { ...order, dir: (valid ? q.dir : mod.default_dir) === 'asc' ? 'ASC' : 'DESC' };
}

export function pageOf(q: ListQuery, defaultSize: number) {
  const pageSize = Math.min(Math.max(1, q.pageSize || defaultSize), 100);
  const page = Math.max(1, q.page || 1);
  return { page, pageSize, offset: (page - 1) * pageSize };
}

/** Lee los parámetros de lista de la URL (page, page_size, sort, dir, filters en JSON). Null si los filtros no son JSON. */
export function listQueryFrom(url: URL, defaultSize: number): ListQuery | null {
  let filters: Record<string, unknown> = {};
  try {
    const raw = url.searchParams.get('filters');
    if (raw) filters = JSON.parse(raw);
  } catch {
    return null;
  }
  return {
    page: Number(url.searchParams.get('page')) || 1,
    pageSize: Number(url.searchParams.get('page_size')) || defaultSize,
    sort: url.searchParams.get('sort') ?? undefined,
    dir: url.searchParams.get('dir') === 'asc' ? 'asc' : 'desc',
    filters: filters && typeof filters === 'object' ? filters : {},
  };
}

// ─── Expresiones para tablas reales y consultas ──────────────────────────────

export type ColumnInfo = { name: string; array: boolean };

export const quoteIdent = (name: string) => `"${name.replace(/"/g, '""')}"`;

/** Expresiones sobre el alias `t` (tabla o subconsulta). Solo admite columnas que existan de verdad. */
export function columnExprs(columns: Map<string, ColumnInfo>): Exprs {
  const col = (field: string) => {
    if (!columns.has(field)) throw new Error(`Columna no válida: ${field}`);
    return `t.${quoteIdent(field)}`;
  };
  return {
    text: (f) => ({ sql: `${col(f)}::text`, params: [] }),
    date: (f) => ({ sql: `left(${col(f)}::text, 10)`, params: [] }),
    number: (f) => ({ sql: `${col(f)}::numeric`, params: [] }),
    isTrue: (f) => ({ sql: `${col(f)} IS TRUE`, params: [] }),
    anyOf: (f, list) =>
      columns.get(f)?.array
        ? { sql: `${col(f)}::text[] && ?::text[]`, params: [list] }
        : { sql: `${col(f)}::text = ANY(?::text[])`, params: [list] },
    search: (pattern) => ({ sql: 't::text ILIKE ?', params: [pattern] }),
    sort: (f) => ({ sql: col(f), params: [] }),
  };
}
