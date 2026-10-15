// Migraciones y datos de ejemplo de la base (Neon / PostgreSQL).
//
//   pnpm db:migrate    → aplica db/migrations/*.sql que falten, en orden, cada una en su transacción
//   pnpm db:status     → lista las aplicadas y las pendientes
//   pnpm db:seed       → carga db/seeds/demo.sql (solo ramas de desarrollo)
//
// Usa DATABASE_URL_UNPOOLED (conexión directa): las migraciones no deben ir por el pooler.
// Lee .env si existe; en CI o Vercel basta con tener la variable definida.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import pg from 'pg';

if (existsSync('.env')) process.loadEnvFile('.env');
const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) {
  console.error('Falta DATABASE_URL_UNPOOLED (cadena de Neon sin -pooler).');
  process.exit(1);
}
if (url.includes('-pooler')) {
  console.error('DATABASE_URL_UNPOOLED apunta al pooler. Usa la cadena directa (sin -pooler) para migrar.');
  process.exit(1);
}

const command = process.argv[2] ?? 'migrate';
const client = new pg.Client({ connectionString: url });
await client.connect();
const host = new URL(url).hostname;

try {
  if (command === 'seed') {
    await client.query('BEGIN');
    await client.query(readFileSync('db/seeds/demo.sql', 'utf8'));
    await client.query('COMMIT');
    console.log(`✓ Datos de ejemplo cargados en ${host}`);
  } else {
    await client.query(`CREATE SCHEMA IF NOT EXISTS admin;
      CREATE TABLE IF NOT EXISTS admin.schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
    const { rows } = await client.query('SELECT name FROM admin.schema_migrations');
    const applied = new Set(rows.map((r) => r.name));
    const files = readdirSync('db/migrations').filter((f) => f.endsWith('.sql')).sort();
    const pending = files.filter((f) => !applied.has(f));

    if (command === 'status') {
      for (const f of files) console.log(`${applied.has(f) ? '✓ aplicada ' : '· pendiente'}  ${f}`);
    } else {
      if (!pending.length) console.log(`Sin migraciones pendientes en ${host}`);
      for (const f of pending) {
        await client.query('BEGIN');
        try {
          await client.query(readFileSync(`db/migrations/${f}`, 'utf8'));
          await client.query('INSERT INTO admin.schema_migrations (name) VALUES ($1)', [f]);
          await client.query('COMMIT');
          console.log(`✓ ${f}`);
        } catch (e) {
          await client.query('ROLLBACK');
          console.error(`✗ ${f}: ${e.message}`);
          process.exitCode = 1;
          break;
        }
      }
    }
  }
} finally {
  await client.end();
}
