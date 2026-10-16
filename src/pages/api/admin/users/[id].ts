import type { APIRoute } from 'astro';
import { destroyUserSessions } from '@/features/admin/auth/server/auth';
import { audit, exec, transaction } from '@/shared/server/db';
import { fail, json, readJson, toId } from '@/shared/server/http';
import { hashPassword, PASSWORD_MIN } from '@/features/admin/auth/server/password';
import { parsePermissions, parseRole, savePermissions } from '@/features/admin/users/server/users';

export const prerender = false;

/**
 * Cambia nombre, rol, permisos, estado y, si llega, la contraseña. Desactivar o cambiar la contraseña cierra sus
 * sesiones. Nadie puede quitarse a sí mismo el rol de administrador ni desactivarse.
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  const id = toId(params.id);
  if (!id) return fail(400, 'Usuario no válido.');
  const me = locals.adminUser!;
  const body = (await readJson(request)) as Record<string, unknown> | null;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const isActive = body?.is_active !== false;
  const password = typeof body?.password === 'string' ? body.password : '';
  const role = parseRole(body?.role);
  const permissions = parsePermissions(body?.permissions);

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = 'Obligatorio.';
  if (password && password.length < PASSWORD_MIN) fieldErrors.password = `Mínimo ${PASSWORD_MIN} caracteres.`;
  if (Object.keys(fieldErrors).length) return fail(422, 'Revisa los campos marcados.', { fieldErrors });
  if (id === me.id && !isActive) return fail(409, 'No puedes desactivar tu propia cuenta.');
  if (id === me.id && role !== 'admin') return fail(409, 'No puedes quitarte a ti mismo el rol de administrador.');

  const passwordHash = password ? await hashPassword(password) : null;
  const changed = await transaction(async (q) => {
    const rows = await q('UPDATE admin.users SET name = ?, is_active = ?, role = ?, updated_at = now() WHERE id = ? RETURNING id', [
      name,
      isActive,
      role,
      id,
    ]);
    if (!rows.length) return false;
    if (passwordHash) await q('UPDATE admin.users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
    await savePermissions(q, id, role, permissions);
    return true;
  });
  if (!changed) return fail(404, 'El usuario no existe.');
  if (!isActive || (password && id !== me.id)) await destroyUserSessions(id);

  await audit({ userId: me.id, action: 'user_update', detail: { id, role, is_active: isActive, password: !!password } });
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
