// Conexión a Neon (PostgreSQL) para las funciones de Vercel: node-postgres con la cadena con pooling (-pooler) y el
// pool enganchado a Vercel Fluid compute con attachDatabasePool, como recomienda Neon.
import { attachDatabasePool } from '@vercel/functions';
import { DATABASE_URL } from 'astro:env/server';
import pg from 'pg';

// COUNT(*) y bigint llegan como texto; aquí siempre caben en un number.
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => Number(v));

let pool: pg.Pool | undefined;

function getPool() {
  if (!pool) {
    pool = new pg.Pool({ connectionString: DATABASE_URL, max: 5, idleTimeoutMillis: 10_000 });
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
