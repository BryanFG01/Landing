import type { APIRoute } from 'astro';
import { audit, one } from '@/shared/server/db';
import { fail, json, readJson } from '@/shared/server/http';
import { listGroups } from '@/features/admin/core/server/modules';

export const prerender = false;

export const GET: APIRoute = async () => json({ groups: await listGroups() });

export const POST: APIRoute = async ({ request, locals }) => {
  const body = (await readJson(request)) as { name?: unknown; sort_order?: unknown } | null;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) return fail(400, 'El grupo necesita un nombre.');
  const group = await one(
    'INSERT INTO admin.module_groups (name, sort_order) VALUES (?, ?) RETURNING id, name, sort_order',
    [name, Math.floor(Number(body?.sort_order) || 0)],
  );
  await audit({ userId: locals.adminUser!.id, action: 'group_create', detail: { name } });
  return json({ group }, 201);
};
