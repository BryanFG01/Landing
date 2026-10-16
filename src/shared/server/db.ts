// Conexión a Neon (PostgreSQL) para las funciones de Vercel: node-postgres con la cadena con pooling (-pooler) y el
// pool enganchado a Vercel Fluid compute con attachDatabasePool, como recomienda Neon.
import { attachDatabasePool } from '@vercel/functions';
import { getSecret } from 'astro:env/server';
import pg from 'pg';

// COUNT(*) y bigint llegan como texto; aquí siempre caben en un number.
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => Number(v));
// numeric como número (precios, totales de las consultas) y date como 'YYYY-MM-DD' (sin pasar por la zona horaria).
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => Number(v));
pg.types.setTypeParser(pg.types.builtins.DATE, (v) => v);

let pool: pg.Pool | undefined;

/** La base no está configurada (falta DATABASE_URL). Se distingue para dar un mensaje claro en el panel. */
export class DbConfigError extends Error {}

function getPool() {
  if (!pool) {
    // Se lee aquí y no al importar el módulo: el build (que prerenderiza la landing) no necesita la base.
    const connectionString = getSecret('DATABASE_URL');
    if (!connectionString) {
      throw new DbConfigError(
        'Falta DATABASE_URL: añade la cadena de Neon con pooling en las variables del proyecto (Vercel) o en .env (local).',
      );
    }
    pool = new pg.Pool({ connectionString, max: 5, idleTimeoutMillis: 10_000 });
    attachDatabasePool(pool);
  }
  return pool;
}

/**
 * Las consultas se escriben con `?` y se traducen a $1, $2… en orden. Por eso no se usan los operadores jsonb
 * que llevan `?` (`?`, `?|`, `?&`): en su lugar, jsonb_exists_any() y similares.
 */
const toPg = (text: string) => {
  let i = 0;
  return text.replace(/\?/g, () => `$${++i}`);
};

export async function query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await getPool().query(toPg(text), params);
  return res.rows as T[];
}

export async function one<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T | null> {
  return (await query<T>(text, params))[0] ?? null;
}

/** Ejecuta y devuelve cuántas filas cambió. */
export async function exec(text: string, params: unknown[] = []): Promise<number> {
  const res = await getPool().query(toPg(text), params);
  return res.rowCount ?? 0;
}

/** Varias sentencias en una transacción. */
export async function transaction<T>(fn: (q: typeof query) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(async (text, params = []) => (await client.query(toPg(text), params)).rows);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/** Roles sin login para lo que se ejecuta contra el esquema datos (ver db/migrations/0003_fase2.sql). */
export const DATOS_ROLE = { editor: 'admin_datos_editor', lector: 'admin_datos_lector' } as const;

export type ScopedQuery = <T = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<T[]>;

/**
 * Transacción con el rol de datos: no ve el esquema admin, search_path = datos y tiempo máximo por sentencia.
 * `readOnly` además impide cualquier escritura. `fn` recibe la función de consulta (con `?`) y el cliente crudo.
 */
export async function scoped<T>(
  opts: { role: keyof typeof DATOS_ROLE; readOnly?: boolean; timeoutMs?: number },
  fn: (q: ScopedQuery, client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query(opts.readOnly ? 'BEGIN READ ONLY' : 'BEGIN');
    await client.query(
      `SET LOCAL ROLE ${DATOS_ROLE[opts.role]}; SET LOCAL search_path = datos; SET LOCAL statement_timeout = ${Math.floor(opts.timeoutMs ?? 10_000)}`,
    );
    const q: ScopedQuery = async (text, params = []) => (await client.query(toPg(text), params)).rows;
    const result = await fn(q, client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/** Error de PostgreSQL con código SQLSTATE. */
export const pgCode = (e: unknown) => (e && typeof e === 'object' && 'code' in e ? String(e.code) : '');

/** Mensaje entendible para los errores de datos más comunes al escribir en una tabla. Null si no es uno de ellos. */
export function friendlyDbError(e: unknown): string | null {
  const code = pgCode(e);
  const detail = e && typeof e === 'object' && 'detail' in e && e.detail ? ` (${String(e.detail)})` : '';
  const column = e && typeof e === 'object' && 'column' in e && e.column ? ` "${String(e.column)}"` : '';
  switch (code) {
    case '23505':
      return `Ya existe un registro con ese valor${detail}.`;
    case '23503':
      return `El dato está relacionado con otros registros${detail}.`;
    case '23502':
      return `Falta un dato obligatorio en la columna${column}.`;
    case '23514':
      return `Un valor no cumple las reglas de la tabla${detail}.`;
    case '22P02':
    case '22007':
    case '22008':
    case '22003':
      return `Hay un valor con formato no válido para la columna${column}.`;
    case '42501':
      return 'Sin permiso sobre esa tabla. Si la creaste desde un IDE con otro usuario, dale permisos al panel (ver ADMIN.md).';
    case '57014':
      return 'La consulta tardó demasiado y se canceló.';
    default:
      return null;
  }
}

export async function audit(entry: {
  userId?: number | null;
  action: string;
  moduleId?: number | null;
  recordId?: number | null;
  subject?: string | null;
  detail?: unknown;
}) {
  await exec(
    'INSERT INTO admin.audit_log (user_id, action, module_id, record_id, subject, detail) VALUES (?, ?, ?, ?, ?, ?::jsonb)',
    [
      entry.userId ?? null,
      entry.action,
      entry.moduleId ?? null,
      entry.recordId ?? null,
      entry.subject ?? null,
      entry.detail === undefined ? null : JSON.stringify(entry.detail),
    ],
  );
}
