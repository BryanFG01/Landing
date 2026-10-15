// Consulta y escritura de registros de un módulo (PostgreSQL, datos en jsonb). El SQL es fijo; lo único que viene de
// la configuración son los nombres de campo, que van siempre como parámetros (r.data->>?) y además se validan contra
// la definición del módulo. Los valores van como parámetros enlazados, nunca concatenados.

import { SLUG_RE, SYSTEM_FIELDS, type FieldConfig, type FilterConfig, type RecordRow, type RecordsPage } from '../schema';
import { exec, one, query } from './db';
import { getModuleByKey, listModules, type LoadedModule } from './modules';

type Sql = { sql: string; params: unknown[] };

const SYSTEM_COLUMN: Record<string, string> = { id: 'r.id', created_at: 'r.created_at', updated_at: 'r.updated_at' };

function checkField(field: string) {
  if (!(field in SYSTEM_FIELDS) && !SLUG_RE.test(field)) throw new Error(`Campo no válido: ${field}`);
}

/** Valor como texto. */
function textExpr(field: string): Sql {
  checkField(field);
  if (field in SYSTEM_COLUMN) return { sql: `${SYSTEM_COLUMN[field]}::text`, params: [] };
  return { sql: 'r.data->>?', params: [field] };
}

/** Fecha como texto YYYY-MM-DD, para comparar días (las fechas de sistema, en UTC). */
function dateExpr(field: string): Sql {
  checkField(field);
  if (field === 'created_at' || field === 'updated_at') {
    return { sql: `to_char(${SYSTEM_COLUMN[field]} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`, params: [] };
  }
  return { sql: 'left(r.data->>?, 10)', params: [field] };
}

/** Valor numérico (null si el dato no es un número). */
function numberExpr(field: string): Sql {
  checkField(field);
  if (field === 'id') return { sql: 'r.id', params: [] };
  return { sql: "(CASE WHEN jsonb_typeof(r.data->?) = 'number' THEN (r.data->>?)::numeric END)", params: [field, field] };
}

/** Expresión para ordenar: jsonb ordena números como números y textos como textos. */
function sortExpr(field: string): Sql {
  checkField(field);
  if (field in SYSTEM_COLUMN) return { sql: SYSTEM_COLUMN[field], params: [] };
  return { sql: 'r.data->?', params: [field] };
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Convierte los valores del formulario de filtros en condiciones WHERE, según la configuración del módulo. */
function buildWhere(mod: LoadedModule, values: Record<string, unknown>): Sql {
  const parts: string[] = ['r.module_id = ?'];
  const params: unknown[] = [mod.id];
  const fieldType = (key: string) => mod.fields.find((f) => f.key === key)?.type;

  for (const filter of mod.filters) {
    const value = values[filter.name];
    if (value === undefined || value === null || value === '' || value === false) continue;
    if (Array.isArray(value) && !value.length) continue;
    const cond = filterCondition(filter, value, fieldType(filter.field));
    if (cond) {
      parts.push(cond.sql);
      params.push(...cond.params);
    }
  }
  return { sql: parts.join(' AND '), params };
}

function filterCondition(filter: FilterConfig, value: unknown, type: FieldConfig['type'] | undefined): Sql | null {
  // Búsqueda general: cualquier valor del registro.
  if (filter.field === '*') {
    return {
      sql: 'EXISTS (SELECT 1 FROM jsonb_each_text(r.data) j WHERE j.value ILIKE ?)',
      params: [`%${escapeLike(String(value))}%`],
    };
  }

  switch (filter.control) {
    case 'text': {
      const f = textExpr(filter.field);
      return { sql: `${f.sql} ILIKE ?`, params: [...f.params, `%${escapeLike(String(value))}%`] };
    }

    case 'select':
    case 'multiselect': {
      const list = (Array.isArray(value) ? value : [value]).map(String);
      // Campo de varias opciones: basta con que coincida alguna.
      if (type === 'multiselect') {
        return { sql: 'jsonb_exists_any(r.data->?, ?::text[])', params: [filter.field, list] };
      }
      const f = textExpr(filter.field);
      return { sql: `${f.sql} = ANY(?::text[])`, params: [...f.params, list] };
    }

    case 'date': {
      const f = dateExpr(filter.field);
      return { sql: `${f.sql} = ?`, params: [...f.params, String(value).slice(0, 10)] };
    }

    case 'daterange': {
      const { from, to } = (value ?? {}) as { from?: string; to?: string };
      const f = dateExpr(filter.field);
      const sql: string[] = [];
      const params: unknown[] = [];
      if (from) sql.push(`${f.sql} >= ?`), params.push(...f.params, from.slice(0, 10));
      if (to) sql.push(`${f.sql} <= ?`), params.push(...f.params, to.slice(0, 10));
      return sql.length ? { sql: sql.join(' AND '), params } : null;
    }

    case 'number': {
      const n = Number(value);
      if (!Number.isFinite(n)) return null;
      const f = numberExpr(filter.field);
      const op = { eq: '=', gte: '>=', lte: '<=' }[filter.operator ?? 'eq'];
      return { sql: `${f.sql} ${op} ?`, params: [...f.params, n] };
    }

    case 'boolean':
      return { sql: "r.data->? = 'true'::jsonb", params: [filter.field] };
  }
}

export interface ListQuery {
  page: number;
  pageSize: number;
  sort?: string;
  dir?: 'asc' | 'desc';
  filters: Record<string, unknown>;
}

type RecordDbRow = { id: number; data: Record<string, unknown>; created_at: Date; updated_at: Date };

const toRow = (r: RecordDbRow): RecordRow => ({
  ...r.data,
  id: r.id,
  created_at: r.created_at.toISOString(),
  updated_at: r.updated_at.toISOString(),
});

export async function listRecords(mod: LoadedModule, q: ListQuery): Promise<RecordsPage> {
  const where = buildWhere(mod, q.filters);

  // Solo se ordena por columnas marcadas como ordenables o por el orden por defecto del módulo.
  const sortable = new Set([mod.default_sort, ...mod.column_configs.filter((c) => c.sortable).map((c) => c.column)]);
  const sortField = q.sort && sortable.has(q.sort) ? q.sort : mod.default_sort;
  const dir = (q.sort && sortable.has(q.sort) ? q.dir : mod.default_dir) === 'asc' ? 'ASC' : 'DESC';
  const order = sortExpr(sortField);

  const pageSize = Math.min(Math.max(1, q.pageSize || mod.page_size), 100);
  const page = Math.max(1, q.page || 1);

  const [count, rows] = await Promise.all([
    one<{ n: number }>(`SELECT COUNT(*)::int AS n FROM admin.records r WHERE ${where.sql}`, where.params),
    query<RecordDbRow>(
      `SELECT r.id, r.data, r.created_at, r.updated_at FROM admin.records r WHERE ${where.sql}
       ORDER BY ${order.sql} ${dir} NULLS LAST, r.id ${dir} LIMIT ? OFFSET ?`,
      [...where.params, ...order.params, pageSize, (page - 1) * pageSize],
    ),
  ]);

  return {
    type: 'table',
    columnConfigs: mod.column_configs,
    data: rows.map(toRow),
    page,
    page_size: pageSize,
    total_rows: count?.n ?? 0,
  };
}

export async function getRecord(mod: LoadedModule, id: number) {
  const row = await one<RecordDbRow>(
    'SELECT id, data, created_at, updated_at FROM admin.records WHERE id = ? AND module_id = ?',
    [id, mod.id],
  );
  return row ? toRow(row) : null;
}

/** Comprueba que los registros referenciados por los campos de relación existen en su módulo. */
export async function checkRelationValues(mod: LoadedModule, data: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  for (const f of mod.fields.filter((f) => f.type === 'relation' && data[f.key] !== undefined)) {
    const target = await getModuleByKey(f.relation_module!, { activeOnly: false });
    const exists =
      target && (await one('SELECT 1 FROM admin.records WHERE id = ? AND module_id = ?', [data[f.key], target.id]));
    if (!exists) errors[f.key] = 'El registro seleccionado no existe.';
  }
  return errors;
}

export async function insertRecord(mod: LoadedModule, data: Record<string, unknown>, userId: number) {
  const row = await one<{ id: number }>(
    'INSERT INTO admin.records (module_id, data, created_by, updated_by) VALUES (?, ?::jsonb, ?, ?) RETURNING id',
    [mod.id, JSON.stringify(data), userId, userId],
  );
  return row!.id;
}

export async function updateRecord(mod: LoadedModule, id: number, data: Record<string, unknown>, userId: number) {
  const changed = await exec(
    'UPDATE admin.records SET data = ?::jsonb, updated_by = ?, updated_at = now() WHERE id = ? AND module_id = ?',
    [JSON.stringify(data), userId, id, mod.id],
  );
  return changed > 0;
}

export async function deleteRecord(mod: LoadedModule, id: number) {
  return (await exec('DELETE FROM admin.records WHERE id = ? AND module_id = ?', [id, mod.id])) > 0;
}

/** Registros de otros módulos que apuntan a este (para no dejar relaciones colgando al borrar). */
export async function countReferences(mod: LoadedModule, id: number) {
  let total = 0;
  for (const m of await listModules()) {
    if (m.id === mod.id) continue;
    for (const f of m.fields) {
      if (f.type !== 'relation' || f.relation_module !== mod.module_key) continue;
      const row = await one<{ n: number }>(
        'SELECT COUNT(*)::int AS n FROM admin.records WHERE module_id = ? AND data->>? = ?',
        [m.id, f.key, String(id)],
      );
      total += row?.n ?? 0;
    }
  }
  return total;
}

/** Opciones para un campo de relación: id y etiqueta de cada registro del módulo destino. */
export async function relationOptions(field: FieldConfig) {
  const target = await getModuleByKey(field.relation_module!, { activeOnly: false });
  if (!target || !SLUG_RE.test(field.relation_label ?? '')) return [];
  const rows = await query<{ id: number; label: string | null }>(
    `SELECT id, data->>? AS label FROM admin.records WHERE module_id = ?
     ORDER BY lower(data->>?) NULLS LAST LIMIT 1000`,
    [field.relation_label, target.id, field.relation_label],
  );
  return rows.map((r) => ({ value: String(r.id), label: r.label ?? `#${r.id}` }));
}
