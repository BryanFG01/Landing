// Un módulo puede leer de tres sitios: registros del panel (admin.records), una tabla real del esquema datos o una
// consulta SQL. Las rutas de la API llaman a estas funciones y no necesitan saber de dónde salen las filas.

import type { FieldConfig, Option, RecordRow, RecordsPage } from '../schema';
import { friendlyDbError, one, scoped, type ScopedQuery } from './db';
import { checkQuerySql, columnMaps, getTable, plainRow, readOnly, tableRef, type PgTable } from './datos';
import { buildOrder, buildWhere, columnExprs, pageOf, quoteIdent, type ColumnInfo, type ListQuery } from './filters';
import { getModuleByKey, listModules, type LoadedModule } from './modules';
import * as records from './records';

/** Error que se muestra tal cual (tabla borrada, consulta rota…). */
export class SourceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Traduce errores de la base a SourceError cuando se pueden explicar. */
async function friendly<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof SourceError) throw e;
    const msg = friendlyDbError(e);
    if (msg) throw new SourceError(msg, 422);
    // Errores de SQL de una consulta: el mensaje de PostgreSQL ayuda a corregirla.
    if (e instanceof Error && 'code' in e && String(e.code).startsWith('42')) {
      throw new SourceError(`Error en la consulta: ${e.message}`, 422);
    }
    throw e;
  }
}

// ─── Tablas reales ───────────────────────────────────────────────────────────

async function requireTable(mod: LoadedModule): Promise<PgTable & { pk: string }> {
  const t = mod.source ? await getTable(mod.source) : null;
  if (!t) throw new SourceError(`La tabla "${mod.source}" ya no existe en la base de datos.`, 409);
  const pk = mod.source_pk && t.columns.some((c) => c.name === mod.source_pk) ? mod.source_pk : t.pk;
  if (!pk) throw new SourceError(`La tabla "${t.name}" no tiene clave primaria.`, 409);
  return { ...t, pk };
}

const tableRowOf = (pk: string) => (row: Record<string, unknown>): RecordRow => ({
  ...plainRow(row),
  __id: row[pk] as string | number,
});

/** Valor listo para la columna: objetos (fotos, archivos) y listas en columnas json van como JSON. */
function columnValue(t: PgTable, column: string, v: unknown) {
  const isJson = /json/.test(t.columns.find((c) => c.name === column)?.type ?? '');
  if (v === undefined) return null;
  if (v !== null && typeof v === 'object' && (isJson || !Array.isArray(v))) return JSON.stringify(v);
  return v;
}

async function listTable(mod: LoadedModule, q: ListQuery, limit?: number) {
  const t = await requireTable(mod);
  const x = columnExprs(columnMaps(t).info);
  const where = buildWhere(mod.filters, mod.fields, q.filters, x);
  const order = buildOrder(mod, q, x);
  const { page, pageSize, offset } = limit ? { page: 1, pageSize: limit, offset: 0 } : pageOf(q, mod.page_size);
  const from = `${tableRef(t.name)} t`;
  return friendly(() =>
    scoped({ role: 'editor', readOnly: true }, async (run) => {
      const [count] = await run<{ n: number }>(`SELECT COUNT(*)::int AS n FROM ${from} WHERE ${where.sql}`, where.params);
      const rows = await run(
        `SELECT t.* FROM ${from} WHERE ${where.sql}
         ORDER BY ${order.sql} ${order.dir} NULLS LAST, t.${quoteIdent(t.pk)} ${order.dir} LIMIT ? OFFSET ?`,
        [...where.params, ...order.params, pageSize, offset],
      );
      return { rows: rows.map(tableRowOf(t.pk)), total: count?.n ?? 0, page, pageSize };
    }),
  );
}

// ─── Consultas ───────────────────────────────────────────────────────────────

function querySql(mod: LoadedModule) {
  const error = checkQuerySql(mod.source ?? '');
  if (error) throw new SourceError(error, 409);
  return mod.source!.trim().replace(/;\s*$/, '');
}

/** En una consulta, `fields` describe sus columnas (no hay formulario). */
const queryColumns = (mod: LoadedModule) =>
  new Map<string, ColumnInfo>(mod.fields.map((f) => [f.key, { name: f.key, array: f.type === 'multiselect' }]));

async function listQuery(mod: LoadedModule, q: ListQuery, limit?: number) {
  const sql = querySql(mod);
  const x = columnExprs(queryColumns(mod));
  const where = buildWhere(mod.filters, mod.fields, q.filters, x);
  const order = buildOrder(mod, q, x);
  const { page, pageSize, offset } = limit ? { page: 1, pageSize: limit, offset: 0 } : pageOf(q, mod.page_size);
  const from = `(\n${sql}\n) AS t`;
  return friendly(() =>
    readOnly(async (run) => {
      const [count] = await run<{ n: number }>(`SELECT COUNT(*)::int AS n FROM ${from} WHERE ${where.sql}`, where.params);
      const rows = await run(
        `SELECT t.* FROM ${from} WHERE ${where.sql} ORDER BY ${order.sql} ${order.dir} NULLS LAST LIMIT ? OFFSET ?`,
        [...where.params, ...order.params, pageSize, offset],
      );
      // Las filas de una consulta no tienen id propio: se numeran.
      return { rows: rows.map((r, i) => ({ ...plainRow(r), __id: offset + i + 1 })), total: count?.n ?? 0, page, pageSize };
    }),
  );
}

// ─── API común ───────────────────────────────────────────────────────────────

export const canWrite = (mod: LoadedModule) => mod.source_type !== 'query';

export async function listRows(mod: LoadedModule, q: ListQuery): Promise<RecordsPage> {
  if (mod.source_type === 'records') return records.listRecords(mod, q);
  const r = mod.source_type === 'table' ? await listTable(mod, q) : await listQuery(mod, q);
  return { type: 'table', columnConfigs: mod.column_configs, data: r.rows, page: r.page, page_size: r.pageSize, total_rows: r.total };
}

/** Todas las filas que cumplen los filtros, hasta `limit` (exportar). */
export async function allRows(mod: LoadedModule, q: Omit<ListQuery, 'page' | 'pageSize'>, limit: number): Promise<RecordRow[]> {
  const full = { ...q, page: 1, pageSize: limit };
  if (mod.source_type === 'records') return records.allRecords(mod, q, limit);
  return (mod.source_type === 'table' ? await listTable(mod, full, limit) : await listQuery(mod, full, limit)).rows;
}

/** Id de la URL: entero en registros; en tablas, el valor de la clave como texto. */
export function parseRowId(mod: LoadedModule, raw: string | undefined): string | number | null {
  if (!raw) return null;
  if (mod.source_type === 'records') {
    const n = Number(raw);
    return Number.isInteger(n) && n > 0 ? n : null;
  }
  return raw.length <= 200 ? raw : null;
}

export async function getRow(mod: LoadedModule, id: string | number): Promise<RecordRow | null> {
  if (mod.source_type === 'records') return records.getRecord(mod, id as number);
  if (mod.source_type !== 'table') return null;
  const t = await requireTable(mod);
  return friendly(() =>
    scoped({ role: 'editor', readOnly: true }, async (run) => {
      const [row] = await run(`SELECT t.* FROM ${tableRef(t.name)} t WHERE t.${quoteIdent(t.pk)}::text = ?`, [String(id)]);
      return row ? tableRowOf(t.pk)(row) : null;
    }),
  );
}

export async function insertRow(mod: LoadedModule, data: Record<string, unknown>, userId: number) {
  if (mod.source_type === 'records') return records.insertRecord(mod, data, userId);
  const t = await requireTable(mod);
  return friendly(() => scoped({ role: 'editor' }, (run) => insertTableRow(t, data, run)));
}

async function insertTableRow(t: PgTable & { pk: string }, data: Record<string, unknown>, run: ScopedQuery) {
  const cols = Object.keys(data).filter((k) => t.columns.some((c) => c.name === k));
  const sql = cols.length
    ? `INSERT INTO ${tableRef(t.name)} (${cols.map(quoteIdent).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
    : `INSERT INTO ${tableRef(t.name)} DEFAULT VALUES`;
  const [row] = await run<Record<string, unknown>>(
    `${sql} RETURNING ${quoteIdent(t.pk)} AS id`,
    cols.map((c) => columnValue(t, c, data[c])),
  );
  return row.id as string | number;
}

/** Varias filas a la vez, todas o ninguna (importación). */
export async function insertRows(mod: LoadedModule, rows: Record<string, unknown>[], userId: number) {
  if (mod.source_type === 'records') return records.insertRecords(mod, rows, userId);
  const t = await requireTable(mod);
  await friendly(() =>
    scoped({ role: 'editor', timeoutMs: 30_000 }, async (run) => {
      for (const data of rows) await insertTableRow(t, data, run);
    }),
  );
}

/** Reemplaza los campos del formulario: los que llegan vacíos quedan en NULL. */
export async function updateRow(mod: LoadedModule, id: string | number, data: Record<string, unknown>, userId: number) {
  if (mod.source_type === 'records') {
    // Se conservan los datos de campos que ya no existen en el módulo, por si se vuelven a añadir.
    const previous = await records.getRecord(mod, id as number);
    if (!previous) return false;
    const current = new Set(mod.fields.map((f) => f.key));
    const kept = Object.fromEntries(
      Object.entries(previous).filter(([k]) => !current.has(k) && !['__id', 'id', 'created_at', 'updated_at'].includes(k)),
    );
    return records.updateRecord(mod, id as number, { ...kept, ...data }, userId);
  }
  const t = await requireTable(mod);
  const cols = mod.fields
    .map((f) => f.key)
    .filter((k) => k !== t.pk && k !== 'updated_at' && t.columns.some((c) => c.name === k));
  if (!cols.length) return true;
  // Si la tabla tiene updated_at, el panel la mantiene al día.
  const touch = t.columns.some((c) => c.name === 'updated_at') ? ', updated_at = now()' : '';
  return friendly(() =>
    scoped({ role: 'editor' }, async (run) => {
      const rows = await run(
        `UPDATE ${tableRef(t.name)} t SET ${cols.map((c) => `${quoteIdent(c)} = ?`).join(', ')}${touch}
         WHERE t.${quoteIdent(t.pk)}::text = ? RETURNING 1`,
        [...cols.map((c) => columnValue(t, c, data[c] ?? null)), String(id)],
      );
      return rows.length > 0;
    }),
  );
}

export async function deleteRow(mod: LoadedModule, id: string | number) {
  if (mod.source_type === 'records') return records.deleteRecord(mod, id as number);
  const t = await requireTable(mod);
  return friendly(() =>
    scoped({ role: 'editor' }, async (run) => {
      const rows = await run(`DELETE FROM ${tableRef(t.name)} t WHERE t.${quoteIdent(t.pk)}::text = ? RETURNING 1`, [
        String(id),
      ]);
      return rows.length > 0;
    }),
  );
}

/** Filas de un módulo (dashboard). Null en consultas, que pueden ser caras. */
export async function countRows(mod: LoadedModule): Promise<number | null> {
  if (mod.source_type === 'records') {
    return (await one<{ n: number }>('SELECT COUNT(*)::int AS n FROM admin.records WHERE module_id = ?', [mod.id]))?.n ?? 0;
  }
  if (mod.source_type === 'query' || !mod.source) return null;
  try {
    return await scoped({ role: 'editor', readOnly: true, timeoutMs: 3000 }, async (run) => {
      const [r] = await run<{ n: number }>(`SELECT COUNT(*)::int AS n FROM ${tableRef(mod.source!)}`);
      return r?.n ?? 0;
    });
  } catch {
    return null;
  }
}

// ─── Relaciones entre módulos ────────────────────────────────────────────────

/** Opciones para un campo de relación: id y etiqueta de cada fila del módulo destino. */
export async function relationOptions(field: FieldConfig): Promise<Option[]> {
  const target = await getModuleByKey(field.relation_module!, { activeOnly: false });
  if (!target || !field.relation_label) return [];
  if (target.source_type === 'records') return records.recordOptions(target.id, field.relation_label);
  if (target.source_type !== 'table') return [];
  try {
    const t = await requireTable(target);
    if (!t.columns.some((c) => c.name === field.relation_label)) return [];
    return await scoped({ role: 'editor', readOnly: true }, async (run) => {
      const rows = await run<{ value: string; label: string | null }>(
        `SELECT t.${quoteIdent(t.pk)}::text AS value, t.${quoteIdent(field.relation_label!)}::text AS label
         FROM ${tableRef(t.name)} t ORDER BY 2 NULLS LAST LIMIT 1000`,
      );
      return rows.map((r) => ({ value: r.value, label: r.label ?? `#${r.value}` }));
    });
  } catch {
    return [];
  }
}

/** Comprueba que las filas a las que apuntan los campos de relación existen. */
export async function checkRelationValues(mod: LoadedModule, data: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  for (const f of mod.fields.filter((f) => f.type === 'relation' && data[f.key] !== undefined)) {
    const target = await getModuleByKey(f.relation_module!, { activeOnly: false });
    let exists = false;
    if (target?.source_type === 'records') exists = await records.recordExists(target.id, data[f.key]);
    else if (target?.source_type === 'table') exists = !!(await getRow(target, String(data[f.key])).catch(() => null));
    if (!exists) errors[f.key] = 'El registro seleccionado no existe.';
  }
  return errors;
}

/** Filas de otros módulos que apuntan a esta (para no dejar relaciones colgando al borrar). */
export async function countReferences(mod: LoadedModule, id: string | number) {
  let total = 0;
  for (const m of await listModules()) {
    if (m.id === mod.id || m.source_type === 'query') continue;
    for (const f of m.fields) {
      if (f.type !== 'relation' || f.relation_module !== mod.module_key) continue;
      if (m.source_type === 'records') {
        total += await records.countRecordsPointingTo(m.id, f.key, id);
      } else if (m.source) {
        total += await scoped({ role: 'editor', readOnly: true }, async (run) => {
          const [r] = await run<{ n: number }>(
            `SELECT COUNT(*)::int AS n FROM ${tableRef(m.source!)} t WHERE t.${quoteIdent(f.key)}::text = ?`,
            [String(id)],
          );
          return r?.n ?? 0;
        }).catch(() => 0);
      }
    }
  }
  return total;
}
