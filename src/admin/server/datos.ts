// Esquema "datos": tablas reales, consultas SQL y la consola. Lo que escribe la gente se ejecuta siempre dentro de
// scoped(), con un rol que no ve el esquema admin y con tiempo máximo. Las comprobaciones de texto de aquí son una
// barrera más contra errores (no la principal): impiden salir de la transacción o cambiar de rol a mitad.

import type pg from 'pg';
import { cleanQuerySql, type ColumnDataType, type FieldConfig, type FieldType } from '../schema';
import { query, scoped, type ScopedQuery } from './db';
import type { ColumnInfo } from './filters';
import { quoteIdent } from './filters';

export interface PgColumn {
  name: string;
  type: string;
  /** typcategory de PostgreSQL: N número, S texto, B booleano, D fecha, A array, U otros (json, uuid…). */
  category: string;
  array: boolean;
  not_null: boolean;
  identity: boolean;
  generated: boolean;
  default: string | null;
  pk: boolean;
  /** COMMENT ON COLUMN: se usa como etiqueta del campo. */
  comment: string | null;
  /** Valores de un tipo ENUM. */
  enum_values: string[] | null;
  /** CHECK de esta columna sola (pg_get_constraintdef), para sacar listas de "IN (...)". */
  checks: string[];
  /** Tabla a la que apunta con REFERENCES (clave foránea de una columna). */
  references: string | null;
}

export interface PgTable {
  name: string;
  kind: 'tabla' | 'vista';
  columns: PgColumn[];
  /** Clave primaria de una sola columna, si la hay. */
  pk: string | null;
  /** COMMENT ON TABLE: nombre sugerido del módulo. */
  comment: string | null;
}

/** Tablas y vistas del esquema datos con sus columnas. */
export async function listTables(only?: string): Promise<PgTable[]> {
  const rows = await query<PgColumn & { table: string; relkind: string; table_comment: string | null }>(
    `SELECT c.relname AS "table", c.relkind::text AS relkind, a.attname AS name,
       format_type(a.atttypid, a.atttypmod) AS type, t.typcategory::text AS category,
       t.typcategory = 'A' AS array, a.attnotnull AS not_null,
       a.attidentity <> '' AS identity, a.attgenerated <> '' AS generated,
       pg_get_expr(d.adbin, d.adrelid) AS default,
       EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid = c.oid AND i.indisprimary AND i.indnatts = 1
               AND a.attnum = i.indkey[0]) AS pk,
       col_description(c.oid, a.attnum) AS comment,
       obj_description(c.oid, 'pg_class') AS table_comment,
       CASE WHEN t.typtype = 'e'
         THEN ARRAY(SELECT e.enumlabel::text FROM pg_enum e WHERE e.enumtypid = t.oid ORDER BY e.enumsortorder)
       END AS enum_values,
       ARRAY(SELECT pg_get_constraintdef(k.oid) FROM pg_constraint k
             WHERE k.conrelid = c.oid AND k.contype = 'c' AND k.conkey = ARRAY[a.attnum]) AS checks,
       (SELECT r.relname::text FROM pg_constraint k JOIN pg_class r ON r.oid = k.confrelid
         WHERE k.conrelid = c.oid AND k.contype = 'f' AND k.conkey = ARRAY[a.attnum] LIMIT 1) AS "references"
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
     JOIN pg_type t ON t.oid = a.atttypid
     LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
     WHERE n.nspname = 'datos' AND c.relkind IN ('r', 'p', 'v', 'm') ${only ? 'AND c.relname = ?' : ''}
     ORDER BY c.relname, a.attnum`,
    only ? [only] : [],
  );
  const tables = new Map<string, PgTable>();
  for (const { table, relkind, table_comment, ...col } of rows) {
    if (!tables.has(table)) {
      const kind = relkind === 'r' || relkind === 'p' ? 'tabla' : 'vista';
      tables.set(table, { name: table, kind, columns: [], pk: null, comment: table_comment });
    }
    const t = tables.get(table)!;
    t.columns.push(col);
    if (col.pk) t.pk = col.name;
  }
  return [...tables.values()];
}

export async function getTable(name: string) {
  return (await listTables(name))[0] ?? null;
}

const MONEY_RE = /precio|total|valor|costo|monto|subtotal|saldo|pago/;

/** Formato de columna por defecto según el tipo de PostgreSQL. */
export function columnTypeOf(c: Pick<PgColumn, 'name' | 'type' | 'category'>): ColumnDataType {
  switch (c.category) {
    case 'N':
      return MONEY_RE.test(c.name) ? 'currency' : 'number';
    case 'B':
      return 'boolean';
    case 'D':
      return c.type === 'date' ? 'date' : 'datetime';
    case 'A':
      return 'list';
    default:
      return 'text';
  }
}

/** Columnas de la tabla como mapa para validar definiciones y armar filtros. */
export const columnMaps = (t: PgTable) => ({
  types: new Map(t.columns.map((c) => [c.name, columnTypeOf(c)] as const)),
  info: new Map<string, ColumnInfo>(t.columns.map((c) => [c.name, { name: c.name, array: c.array }])),
});

const humanize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replaceAll('_', ' ');

/**
 * Valores permitidos por un CHECK de lista: `tipo IN ('a', 'b')` (Postgres lo guarda como `= ANY (ARRAY[...])`).
 * Null si el CHECK es de otra forma (rangos, expresiones…).
 */
export function checkListValues(def: string): string[] | null {
  if (!/=\s*ANY\s*\(/i.test(def) || /\b(AND|OR)\b/i.test(def)) return null;
  const values = [...def.matchAll(/'((?:[^']|'')*)'/g)].map((m) => m[1].replaceAll("''", "'"));
  return values.length ? values : null;
}

/** Opciones de lista de una columna: su ENUM o su CHECK ... IN (...). */
function listOptions(c: PgColumn) {
  const values = c.enum_values ?? c.checks.map(checkListValues).find(Boolean) ?? null;
  return values?.map((v) => ({ value: v, label: humanize(v) })) ?? null;
}

/** Módulo de tabla al que puede apuntar un campo de relación, y el campo que se muestra de él. */
export type RelationTargets = Map<string, { module_key: string; label: string }>;

/**
 * Campo de formulario sugerido para una columna, o null si no se rellena a mano (autonumérica, calculada…).
 * Lee del SQL: COMMENT ON COLUMN (etiqueta), ENUM o CHECK ... IN (...) (lista) y REFERENCES a una tabla con módulo
 * (relación).
 */
export function suggestField(c: PgColumn, relations: RelationTargets = new Map()): FieldConfig | null {
  if (c.identity || c.generated || c.default?.startsWith('nextval(')) return null;
  // Fechas de control: las pone la base (creado) o el panel (updated_at, al editar).
  if (c.name === 'updated_at' || (/^(created_at|creado|actualizado)$/.test(c.name) && c.default)) return null;
  const field = (type: FieldType, extra: Partial<FieldConfig> = {}): FieldConfig => ({
    key: c.name,
    label: c.comment?.trim().slice(0, 60) || humanize(c.name),
    type,
    required: c.not_null && c.default === null,
    ...extra,
  });
  const target = c.references ? relations.get(c.references) : undefined;
  if (target) return field('relation', { relation_module: target.module_key, relation_label: target.label });
  const options = listOptions(c);
  if (options) return field(c.array ? 'multiselect' : 'select', { options });
  return fieldByType(c, field);
}

/** Campo según el tipo de PostgreSQL y el nombre de la columna (correo, teléfono, foto…). */
function fieldByType(c: PgColumn, field: (type: FieldType, extra?: Partial<FieldConfig>) => FieldConfig): FieldConfig | null {
  const n = c.name;
  switch (c.category) {
    case 'N':
      return field(MONEY_RE.test(n) ? 'currency' : 'number');
    case 'B':
      return field('boolean');
    case 'D':
      return field('date');
    case 'A':
      return field('multiselect', { options: [] });
    case 'U':
      if (!/json/.test(c.type)) return field('text');
      if (/foto|imagen|image|photo|logo/.test(n)) return field('image');
      if (/archivo|adjunto|documento|file/.test(n)) return field('file');
      return null;
    default:
      return textField(c, field);
  }
}

/** Texto: el tipo de campo sale del nombre (correo, teléfono, enlace, notas) y el largo máximo de varchar(n). */
function textField(c: PgColumn, field: (type: FieldType, extra?: Partial<FieldConfig>) => FieldConfig): FieldConfig {
  const n = c.name;
  if (/correo|email/.test(n)) return field('email');
  if (/tel|celular|movil|phone|whatsapp/.test(n)) return field('phone');
  if (/url|web|sitio|enlace|link/.test(n)) return field('url');
  if (/descripcion|notas|observacion|comentario|detalle/.test(n)) return field('textarea');
  const len = /\((\d+)\)/.exec(c.type)?.[1];
  return field('text', len ? { max_length: Number(len) } : {});
}

// ─── Consultas de los módulos ────────────────────────────────────────────────

// Funciones que permitirían salir del rol o leer fuera de la base. La transacción ya es de solo lectura y con un rol
// sin acceso a admin; esto cierra los atajos conocidos para cambiar de rol en mitad de una sentencia.
const FORBIDDEN_FUNCS = /\b(set_config|query_to_xml|query_to_xml_and_xmlschema|cursor_to_xml|table_to_xml|schema_to_xml|database_to_xml|dblink\w*|lo_\w+|pg_read_\w+|pg_ls_\w+|pg_stat_file|pg_terminate_backend|pg_cancel_backend)\s*\(/i;

/** Error si la consulta no es aceptable para un módulo de consulta. */
export function checkQuerySql(raw: string): string | null {
  const sql = cleanQuerySql(raw);
  if (!/^(select|with)\b/i.test(sql)) return 'La consulta debe empezar por SELECT o WITH.';
  if (sql.includes(';')) return 'La consulta debe ser una sola sentencia (sin punto y coma).';
  if (FORBIDDEN_FUNCS.test(sql)) return 'La consulta usa una función no permitida en el panel.';
  return null;
}

const OID_TYPES: Record<number, ColumnDataType> = {
  16: 'boolean',
  20: 'number',
  21: 'number',
  23: 'number',
  700: 'number',
  701: 'number',
  1700: 'number',
  1082: 'date',
  1114: 'datetime',
  1184: 'datetime',
  1000: 'list',
  1007: 'list',
  1009: 'list',
  1015: 'list',
  1016: 'list',
};

export interface QueryColumn {
  name: string;
  type: ColumnDataType;
  array: boolean;
}

/** Ejecuta un SELECT de usuario en solo lectura. */
export function readOnly<T>(fn: (q: ScopedQuery, client: pg.PoolClient) => Promise<T>) {
  return scoped({ role: 'lector', readOnly: true, timeoutMs: 10_000 }, fn);
}

/** Columnas que devuelve una consulta (sin traer filas) y unas filas de muestra. */
export async function describeQuery(raw: string, sample = 20) {
  const sql = cleanQuerySql(raw);
  return readOnly(async (_q, client) => {
    const res = await client.query({ text: `SELECT * FROM (\n${sql}\n) AS t LIMIT $1`, values: [sample] });
    const columns: QueryColumn[] = res.fields.map((f) => {
      const type = OID_TYPES[f.dataTypeID] ?? 'text';
      return { name: f.name, type: type === 'number' && MONEY_RE.test(f.name) ? 'currency' : type, array: type === 'list' };
    });
    const names = columns.map((c) => c.name);
    if (new Set(names).size !== names.length) {
      throw new QueryShapeError('Hay columnas con el mismo nombre. Ponles un alias distinto con AS.');
    }
    const bad = names.find((n) => !/^[a-z_][a-z0-9_]{0,62}$/.test(n));
    if (bad) {
      throw new QueryShapeError(`La columna "${bad}" debe llamarse en minúsculas, sin espacios ni tildes. Usa AS nombre.`);
    }
    return { columns, rows: res.rows.map(plainRow) };
  });
}

export class QueryShapeError extends Error {}

/** Campos descriptivos de una consulta (no hay formulario): tipo para filtros y formato. */
export function queryFields(columns: QueryColumn[]): FieldConfig[] {
  const toField: Record<ColumnDataType, FieldType> = {
    text: 'text',
    number: 'number',
    currency: 'currency',
    date: 'date',
    datetime: 'date',
    boolean: 'boolean',
    badge: 'text',
    list: 'multiselect',
    image: 'image',
    file: 'file',
  };
  return columns.map((c) => ({
    key: c.name,
    label: c.name.charAt(0).toUpperCase() + c.name.slice(1).replace(/_/g, ' '),
    type: toField[c.type],
  }));
}

/** Valores de una fila listos para JSON. */
export function plainRow(row: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v instanceof Date) out[k] = v.toISOString();
    else if (typeof v === 'bigint') out[k] = Number(v);
    else if (v instanceof Uint8Array) out[k] = `(${v.length} bytes)`;
    else out[k] = v;
  }
  return out;
}

// ─── Consola SQL ─────────────────────────────────────────────────────────────

/** Quita comentarios y textos entre comillas para revisar solo la estructura. */
function skeleton(sql: string) {
  return sql
    .replace(/\$(\w*)\$[\s\S]*?\$\1\$/g, "''")
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
}

// Sentencias que podrían cerrar la transacción, cambiar el rol o tocar cosas fuera del esquema datos.
const FORBIDDEN_STATEMENT =
  /(^|;)\s*(commit|rollback|begin|start|end|abort|savepoint|release|prepare|set|reset|discard|load|copy|grant|revoke|reassign|security|do|call|listen|notify|unlisten|vacuum|lock|checkpoint|alter\s+(role|user|group|default|system|database|schema)|create\s+(role|user|group|extension|database|schema|event)|drop\s+(role|user|group|database|schema|extension|owned))\b/i;

export function checkConsoleSql(sql: string): string | null {
  const s = skeleton(sql);
  if (!s.trim()) return 'Escribe una consulta.';
  if (FORBIDDEN_STATEMENT.test(s)) {
    return 'Esa sentencia no se puede ejecutar desde el panel (control de transacciones, roles, permisos o esquemas).';
  }
  if (FORBIDDEN_FUNCS.test(s)) return 'La consulta usa una función no permitida en el panel.';
  if (/\badmin\s*\./i.test(s)) return 'El esquema admin es interno del panel. Para leer registros usa la vista "registros".';
  return null;
}

export interface ConsoleResult {
  command: string;
  rowCount: number | null;
  columns: string[];
  rows: unknown[][];
  truncated: boolean;
}

const MAX_ROWS = 500;

/** Ejecuta una o varias sentencias. Sin `allowWrite`, la transacción es de solo lectura. */
export async function runConsole(sql: string, allowWrite: boolean): Promise<ConsoleResult[]> {
  return scoped(
    { role: allowWrite ? 'editor' : 'lector', readOnly: !allowWrite, timeoutMs: 15_000 },
    async (_q, client) => {
      // Protocolo simple: admite varias sentencias separadas por punto y coma.
      const res = (await client.query(sql)) as pg.QueryResult | pg.QueryResult[];
      return (Array.isArray(res) ? res : [res]).slice(-10).map((r) => ({
        command: r.command ?? '',
        rowCount: r.rowCount,
        columns: (r.fields ?? []).map((f) => f.name),
        rows: (r.rows ?? []).slice(0, MAX_ROWS).map((row) => {
          const p = plainRow(row as Record<string, unknown>);
          return (r.fields ?? []).map((f) => p[f.name]);
        }),
        truncated: (r.rows?.length ?? 0) > MAX_ROWS,
      }));
    },
  );
}

/** SELECT * FROM datos.<tabla> de forma segura (nombre validado y entre comillas). */
export const tableRef = (name: string) => `datos.${quoteIdent(name)}`;
