import type { APIRoute } from 'astro';
import { audit, one, query } from '../../../../admin/server/db';
import { fail, json, readJson } from '../../../../admin/server/http';
import { hashPassword, PASSWORD_MIN } from '../../../../admin/server/password';

export const prerender = false;

export const GET: APIRoute = async () => {
  const users = await query('SELECT id, email, name, is_active, last_login_at, created_at FROM admin.users ORDER BY name');
  return json({ users });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const body = (await readJson(request)) as Record<string, unknown> | null;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  const fieldErrors: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = 'Correo no válido.';
  if (!name) fieldErrors.name = 'Obligatorio.';
  if (password.length < PASSWORD_MIN) fieldErrors.password = `Mínimo ${PASSWORD_MIN} caracteres.`;
  if (Object.keys(fieldErrors).length) return fail(422, 'Revisa los campos marcados.', { fieldErrors });

  if (await one('SELECT 1 FROM admin.users WHERE lower(email) = ?', [email])) {
    return fail(409, 'Ya existe un administrador con ese correo.', { fieldErrors: { email: 'Ya está en uso.' } });
  }
  const row = await one<{ id: number }>(
    'INSERT INTO admin.users (email, name, password_hash) VALUES (?, ?, ?) RETURNING id',
    [email, name, await hashPassword(password)],
  );
  await audit({ userId: locals.adminUser!.id, action: 'user_create', subject: email });
  return json({ id: row!.id }, 201);
};
