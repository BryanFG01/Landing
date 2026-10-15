// Consola SQL y tablas del esquema datos: tipos, ejemplos, historial y reglas (sin React).
import type { ColumnDataType, FieldConfig } from '../../schema';

export interface SqlResult {
  command: string;
  rowCount: number | null;
  columns: string[];
  rows: unknown[][];
  truncated: boolean;
}

export interface TableInfo {
  name: string;
  kind: 'tabla' | 'vista';
  pk: string | null;
  /** COMMENT ON TABLE: nombre sugerido para el módulo. */
  comment: string | null;
  columns: { name: string; type: string; pk: boolean; data_type: ColumnDataType }[];
  /** Campos de formulario sugeridos para crear un módulo sobre la tabla. */
  suggested_fields: FieldConfig[];
}

export const SQL_EXAMPLES = [
  {
    label: 'Crear una tabla',
    sql: `CREATE TABLE clientes (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL,
  telefono text,
  barrio text,
  activo boolean NOT NULL DEFAULT true,
  creado timestamptz NOT NULL DEFAULT now()
);`,
  },
  {
    label: 'Insertar filas',
    sql: `INSERT INTO clientes (nombre, telefono, barrio) VALUES
  ('Marta Gómez', '3104587712', 'Centro'),
  ('Julián Rojas', '3157720941', 'La Esperanza');`,
  },
  {
    label: 'Pedidos del mes (registros del panel)',
    sql: `SELECT data->>'estado' AS estado,
       count(*) AS pedidos,
       sum((data->>'total')::numeric) AS total
FROM registros
WHERE modulo = 'pedidos' AND created_at >= date_trunc('month', now())
GROUP BY 1
ORDER BY 2 DESC`,
  },
  {
    label: 'Añadir una columna',
    sql: 'ALTER TABLE clientes ADD COLUMN correo text;',
  },
];

/** Consulta que se muestra al abrir la consola por primera vez. */
export const DEFAULT_SQL = SQL_EXAMPLES[2].sql;

/** Sentencias que borran datos: se pide confirmación antes de ejecutarlas. */
export const isDestructive = (sql: string) => /\b(drop|truncate|delete)\b/i.test(sql);

/** Una sola sentencia SELECT/WITH: se puede convertir en un módulo de consulta. */
export const isSingleSelect = (sql: string) =>
  /^\s*(select|with)\b/i.test(sql) && !sql.trim().replace(/;\s*$/, '').includes(';');

/** La estructura cambió: hay que refrescar la lista de tablas. */
export const changesStructure = (results: SqlResult[]) => results.some((r) => /^(CREATE|ALTER|DROP)/.test(r.command));

/** Texto de una celda del resultado (largo recortado). */
export function cellText(value: unknown) {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
}

/** Una línea del historial (sin saltos ni espacios repetidos). */
export const oneLine = (sql: string) => sql.replace(/\s+/g, ' ');

// ─── Historial en el navegador ───────────────────────────────────────────────

const HISTORY_KEY = 'admin-sql-historial';
const HISTORY_MAX = 15;

export function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch {
    return [];
  }
}

/** Añade una consulta al principio del historial (sin repetir) y lo guarda. */
export function pushHistory(history: string[], sql: string) {
  const next = [sql, ...history.filter((h) => h !== sql)].slice(0, HISTORY_MAX);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Sin almacenamiento: el historial dura lo que la pestaña.
  }
  return next;
}

// ─── De la consola al constructor ────────────────────────────────────────────

/** La consulta pasa al constructor por sessionStorage (puede ser larga para la URL). */
const QUERY_HANDOFF_KEY = 'admin-nueva-consulta';

export function handOffQuery(sql: string) {
  try {
    sessionStorage.setItem(QUERY_HANDOFF_KEY, sql.trim().replace(/;\s*$/, ''));
  } catch {
    // Sin almacenamiento: el constructor abre la consulta vacía.
  }
}

export function takeHandedOffQuery() {
  try {
    const sql = sessionStorage.getItem(QUERY_HANDOFF_KEY) ?? '';
    sessionStorage.removeItem(QUERY_HANDOFF_KEY);
    return sql;
  } catch {
    return '';
  }
}
