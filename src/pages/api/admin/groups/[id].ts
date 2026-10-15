import type { APIRoute } from 'astro';
import { audit, exec } from '../../../../admin/server/db';
import { fail, json, readJson, toId } from '../../../../admin/server/http';

export const prerender = false;

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const id = toId(params.id);
  if (!id) return fail(400, 'Grupo no válido.');
  const body = (await readJson(request)) as { name?: unknown; sort_order?: unknown } | null;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) return fail(400, 'El grupo necesita un nombre.');
  const changed = await exec('UPDATE admin.module_groups SET name = ?, sort_order = ?, updated_at = now() WHERE id = ?', [
    name,
    Math.floor(Number(body?.sort_order) || 0),
    id,
  ]);
  if (!changed) return fail(404, 'El grupo no existe.');
  await audit({ userId: locals.adminUser!.id, action: 'group_update', detail: { id, name } });
  return json({ ok: true });
};

/** Los módulos del grupo no se borran: pasan a "Sin grupo" (ON DELETE SET NULL). */
export const DELETE: APIRoute = async ({ params, locals }) => {
  const id = toId(params.id);
  if (!id) return fail(400, 'Grupo no válido.');
  if (!(await exec('DELETE FROM admin.module_groups WHERE id = ?', [id]))) return fail(404, 'El grupo no existe.');
  await audit({ userId: locals.adminUser!.id, action: 'group_delete', detail: { id } });
  return json({ ok: true });
};
