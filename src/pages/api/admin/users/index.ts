import type { APIRoute } from 'astro';
import { audit, one, query, transaction } from '@/shared/server/db';
import { fail, json, readJson } from '@/shared/server/http';
import { hashPassword, PASSWORD_MIN } from '@/features/admin/auth/server/password';
import { parsePermissions, parseRole, savePermissions } from '@/features/admin/users/server/users';

export const prerender = false;

export const GET: APIRoute = async () => {
  const users = await query(
    `SELECT u.id, u.email, u.name, u.role, u.is_active, u.last_login_at, u.created_at,
       COALESCE((SELECT jsonb_agg(jsonb_build_object('module_id', p.module_id, 'can_edit', p.can_edit))
                 FROM admin.user_modules p WHERE p.user_id = u.id), '[]') AS permissions
     FROM admin.users u ORDER BY u.name`,
  );
  return json({ users });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const body = (await readJson(request)) as Record<string, unknown> | null;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const role = parseRole(body?.role);
  const permissions = parsePermissions(body?.permissions);

  const fieldErrors: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = 'Correo no válido.';
  if (!name) fieldErrors.name = 'Obligatorio.';
  if (password.length < PASSWORD_MIN) fieldErrors.password = `Mínimo ${PASSWORD_MIN} caracteres.`;
  if (Object.keys(fieldErrors).length) return fail(422, 'Revisa los campos marcados.', { fieldErrors });

  if (await one('SELECT 1 FROM admin.users WHERE lower(email) = ?', [email])) {
    return fail(409, 'Ya existe un usuario con ese correo.', { fieldErrors: { email: 'Ya está en uso.' } });
  }
  const passwordHash = await hashPassword(password);
  const id = await transaction(async (q) => {
    const [row] = await q('INSERT INTO admin.users (email, name, password_hash, role) VALUES (?, ?, ?, ?) RETURNING id', [
      email,
      name,
      passwordHash,
      role,
    ]);
    await savePermissions(q, row.id as number, role, permissions);
    return row.id as number;
  });
  await audit({ userId: locals.adminUser!.id, action: 'user_create', subject: email, detail: { role } });
  return json({ id }, 201);
};
