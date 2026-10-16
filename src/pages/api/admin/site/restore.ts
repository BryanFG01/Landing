import type { APIRoute } from 'astro';
import { audit } from '@/shared/server/db';
import { fail, json, readJson } from '@/shared/server/http';
import { restoreVersion } from '@/features/admin/site-editor/server/site';

export const prerender = false;

/** Lleva una publicación anterior al borrador: { version_id }. Hay que publicarla para que se vea. */
export const POST: APIRoute = async ({ request, locals }) => {
  const body = (await readJson(request)) as { version_id?: unknown } | null;
  const id = Number(body?.version_id);
  if (!Number.isInteger(id) || !(await restoreVersion(id))) return fail(404, 'Esa versión no existe.');
  await audit({ userId: locals.adminUser!.id, action: 'site_restore', detail: { version: id } });
  return json({ ok: true });
};
