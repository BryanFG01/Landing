import type { APIRoute } from 'astro';
import { destroyUserSessions } from '../../../../admin/server/auth';
import { audit, exec } from '../../../../admin/server/db';
import { fail, json, readJson, toId } from '../../../../admin/server/http';
import { hashPassword, PASSWORD_MIN } from '../../../../admin/server/password';

export const prerender = false;

/** Cambia nombre, estado y, si llega, la contraseña. Desactivar o cambiar la contraseña cierra sus sesiones. */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  const id = toId(params.id);
  if (!id) return fail(400, 'Usuario no válido.');
  const body = (await readJson(request)) as Record<string, unknown> | null;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const isActive = body?.is_active !== false;
  const password = typeof body?.password === 'string' ? body.password : '';

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = 'Obligatorio.';
  if (password && password.length < PASSWORD_MIN) fieldErrors.password = `Mínimo ${PASSWORD_MIN} caracteres.`;
  if (Object.keys(fieldErrors).length) return fail(422, 'Revisa los campos marcados.', { fieldErrors });
  if (id === locals.adminUser!.id && !isActive) return fail(409, 'No puedes desactivar tu propia cuenta.');

  const changed = await exec('UPDATE admin.users SET name = ?, is_active = ?, updated_at = now() WHERE id = ?', [
    name,
    isActive,
    id,
  ]);
  if (!changed) return fail(404, 'El usuario no existe.');
  if (password) await exec('UPDATE admin.users SET password_hash = ? WHERE id = ?', [await hashPassword(password), id]);
  if (!isActive || (password && id !== locals.adminUser!.id)) await destroyUserSessions(id);

  await audit({ userId: locals.adminUser!.id, action: 'user_update', detail: { id, is_active: isActive, password: !!password } });
  return json({ ok: true });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const id = toId(params.id);
  if (!id) return fail(400, 'Usuario no válido.');
  if (id === locals.adminUser!.id) return fail(409, 'No puedes borrar tu propia cuenta.');
  if (!(await exec('DELETE FROM admin.users WHERE id = ?', [id]))) return fail(404, 'El usuario no existe.');
  await audit({ userId: locals.adminUser!.id, action: 'user_delete', detail: { id } });
  return json({ ok: true });
};
