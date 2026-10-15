// Registros de los módulos de tipo "records" (admin.records, datos en jsonb). El SQL es fijo; lo único que viene de la
// configuración son los nombres de campo, que van siempre como parámetros (r.data->>?) y además se validan contra la
// definición del módulo. Los valores van como parámetros enlazados, nunca concatenados.

import { SLUG_RE, SYSTEM_FIELDS, type RecordRow, type RecordsPage } from '../schema';
import { exec, one, query, transaction } from './db';
import { buildOrder, buildWhere, pageOf, type Exprs, type ListQuery, type Sql } from './filters';
import type { LoadedModule } from './modules';

const SYSTEM_COLUMN: Record<string, string> = { id: 'r.id', created_at: 'r.created_at', updated_at: 'r.updated_at' };

function checkField(field: string) {
  if (!(field in SYSTEM_FIELDS) && !SLUG_RE.test(field)) throw new Error(`Campo no válido: ${field}`);
}

const exprs: Exprs = {
  text(field) {
    checkField(field);
    if (field in SYSTEM_COLUMN) return { sql: `${SYSTEM_COLUMN[field]}::text`, params: [] };
    return { sql: 'r.data->>?', params: [field] };
  },
  // Las fechas de sistema, en UTC.
  date(field) {
    checkField(field);
    if (field === 'created_at' || field === 'updated_at') {
      return { sql: `to_char(${SYSTEM_COLUMN[field]} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`, params: [] };
    }
    return { sql: 'left(r.data->>?, 10)', params: [field] };
  },
  // Null si el dato no es un número.
  number(field) {
    checkField(field);
    if (field === 'id') return { sql: 'r.id', params: [] };
    return { sql: "(CASE WHEN jsonb_typeof(r.data->?) = 'number' THEN (r.data->>?)::numeric END)", params: [field, field] };
  },
  isTrue(field) {
    checkField(field);
    return { sql: "r.data->? = 'true'::jsonb", params: [field] };
  },
  anyOf(field, list) {
    checkField(field);
    return { sql: 'jsonb_exists_any(r.data->?, ?::text[])', params: [field, list] };
  },
  search: (pattern) => ({
    sql: 'EXISTS (SELECT 1 FROM jsonb_each_text(r.data) j WHERE j.value ILIKE ?)',
    params: [pattern],
  }),
  // jsonb ordena números como números y textos como textos.
  sort(field) {
    checkField(field);
    if (field in SYSTEM_COLUMN) return { sql: SYSTEM_COLUMN[field], params: [] };
    return { sql: 'r.data->?', params: [field] };
  },
};

type RecordDbRow = { id: number; data: Record<string, unknown>; created_at: Date; updated_at: Date };

const toRow = (r: RecordDbRow): RecordRow => ({
  ...r.data,
  __id: r.id,
  id: r.id,
  created_at: r.created_at.toISOString(),
  updated_at: r.updated_at.toISOString(),
});

const whereFor = (mod: LoadedModule, filters: Record<string, unknown>): Sql =>
  buildWhere(mod.filters, mod.fields, filters, exprs, { sql: 'r.module_id = ?', params: [mod.id] });

export async function listRecords(mod: LoadedModule, q: ListQuery): Promise<RecordsPage> {
  const where = whereFor(mod, q.filters);
  const order = buildOrder(mod, q, exprs);
  const { page, pageSize, offset } = pageOf(q, mod.page_size);

  const [count, rows] = await Promise.all([
    one<{ n: number }>(`SELECT COUNT(*)::int AS n FROM admin.records r WHERE ${where.sql}`, where.params),
    query<RecordDbRow>(
      `SELECT r.id, r.data, r.created_at, r.updated_at FROM admin.records r WHERE ${where.sql}
       ORDER BY ${order.sql} ${order.dir} NULLS LAST, r.id ${order.dir} LIMIT ? OFFSET ?`,
      [...where.params, ...order.params, pageSize, offset],
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

/** Todas las filas que cumplen los filtros (para exportar), hasta `limit`. */
export async function allRecords(mod: LoadedModule, q: Omit<ListQuery, 'page' | 'pageSize'>, limit: number) {
  const where = whereFor(mod, q.filters);
  const order = buildOrder(mod, q, exprs);
  const rows = await query<RecordDbRow>(
    `SELECT r.id, r.data, r.created_at, r.updated_at FROM admin.records r WHERE ${where.sql}
     ORDER BY ${order.sql} ${order.dir} NULLS LAST, r.id ${order.dir} LIMIT ?`,
    [...where.params, ...order.params, limit],
  );
  return rows.map(toRow);
}

export async function getRecord(mod: LoadedModule, id: number) {
  const row = await one<RecordDbRow>(
    'SELECT id, data, created_at, updated_at FROM admin.records WHERE id = ? AND module_id = ?',
    [id, mod.id],
  );
  return row ? toRow(row) : null;
}

export async function recordExists(moduleId: number, id: unknown) {
  if (!Number.isInteger(id)) return false;
  return !!(await one('SELECT 1 FROM admin.records WHERE id = ? AND module_id = ?', [id, moduleId]));
}

export async function insertRecord(mod: LoadedModule, data: Record<string, unknown>, userId: number) {
  const row = await one<{ id: number }>(
    'INSERT INTO admin.records (module_id, data, created_by, updated_by) VALUES (?, ?::jsonb, ?, ?) RETURNING id',
    [mod.id, JSON.stringify(data), userId, userId],
  );
  return row!.id;
}

/** Varias filas a la vez, todas o ninguna (importación). */
export async function insertRecords(mod: LoadedModule, rows: Record<string, unknown>[], userId: number) {
  await transaction(async (q) => {
    for (const data of rows) {
      await q('INSERT INTO admin.records (module_id, data, created_by, updated_by) VALUES (?, ?::jsonb, ?, ?)', [
        mod.id,
        JSON.stringify(data),
        userId,
        userId,
      ]);
    }
  });
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

/** Cuántos registros de un módulo tienen `field` apuntando a `id`. */
export async function countRecordsPointingTo(moduleId: number, field: string, id: string | number) {
  const row = await one<{ n: number }>(
    'SELECT COUNT(*)::int AS n FROM admin.records WHERE module_id = ? AND data->>? = ?',
    [moduleId, field, String(id)],
  );
  return row?.n ?? 0;
}

/** Opciones (id y etiqueta) de los registros de un módulo, para los campos de relación. */
export async function recordOptions(moduleId: number, labelField: string) {
  if (!SLUG_RE.test(labelField)) return [];
  const rows = await query<{ id: number; label: string | null }>(
    `SELECT id, data->>? AS label FROM admin.records WHERE module_id = ?
     ORDER BY lower(data->>?) NULLS LAST LIMIT 1000`,
    [labelField, moduleId, labelField],
  );
  return rows.map((r) => ({ value: String(r.id), label: r.label ?? `#${r.id}` }));
}
