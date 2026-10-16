import type { APIRoute } from 'astro';
import { parseSite } from '@/features/landing/domain/sitio';
import { audit } from '@/shared/server/db';
import { fail, json, readJson } from '@/shared/server/http';
import { getSiteState, saveDraft } from '@/features/admin/site-editor/server/site';

export const prerender = false;

/** Borrador del sitio, si hay cambios sin publicar, historial de publicaciones y si hay Deploy Hook. */
export const GET: APIRoute = async () => json(await getSiteState());

/** Guarda el borrador. No cambia la landing hasta publicar. */
export const PUT: APIRoute = async ({ request, locals }) => {
  const { value, errors } = parseSite(await readJson(request));
  if (errors.length) return fail(422, 'Revisa el contenido.', { errors: errors.slice(0, 30) });
  await saveDraft(value);
  await audit({ userId: locals.adminUser!.id, action: 'site_draft' });
  return json({ ok: true, content: value });
};
