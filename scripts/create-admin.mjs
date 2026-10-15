// Crea un administrador, o le pone contraseña nueva si ya existe (y cierra sus sesiones).
//
//   pnpm admin:create correo@dominio.com "Nombre Apellido"
//
// Usa la base de DATABASE_URL_UNPOOLED (en .env apunta a la rama de desarrollo de Neon; para producción, ejecútalo
// con la cadena de la rama production). La contraseña se toma de ADMIN_PASSWORD o se genera una aleatoria y se muestra
// una sola vez. El hash usa el mismo formato que src/admin/server/password.ts.

import { existsSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import pg from 'pg';

if (existsSync('.env')) process.loadEnvFile('.env');
const [email, name] = process.argv.slice(2).filter((a) => !a.startsWith('--'));

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) {
  console.error('Uso: pnpm admin:create <correo> "<Nombre>"');
  process.exit(1);
}
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL_UNPOOLED en .env o en el entorno.');
  process.exit(1);
}

const ITERATIONS = 100_000;
const b64 = (bytes) => Buffer.from(bytes).toString('base64');

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256);
  return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}

const generated = !process.env.ADMIN_PASSWORD;
const password =
  process.env.ADMIN_PASSWORD ?? b64(crypto.getRandomValues(new Uint8Array(12))).replace(/[+/=]/g, '').slice(0, 16);
if (password.length < 10) {
  console.error('La contraseña debe tener al menos 10 caracteres.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const hash = await hashPassword(password);
  const existing = await client.query('SELECT id FROM admin.users WHERE lower(email) = lower($1)', [email]);
  if (existing.rows.length) {
    const id = existing.rows[0].id;
    await client.query(
      'UPDATE admin.users SET name = $1, password_hash = $2, is_active = true, updated_at = now() WHERE id = $3',
      [name, hash, id],
    );
    await client.query('DELETE FROM admin.sessions WHERE user_id = $1', [id]);
  } else {
    await client.query('INSERT INTO admin.users (email, name, password_hash) VALUES (lower($1), $2, $3)', [email, name, hash]);
  }
} finally {
  await client.end();
}

console.log(`\n✓ Administrador listo en ${new URL(url).hostname}: ${email}`);
if (generated) console.log(`  Contraseña: ${password}\n  Guárdala ahora: no se vuelve a mostrar.`);
console.log('  Entra en /admin/login\n');
