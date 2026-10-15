import type { APIRoute } from 'astro';
import { DEFAULT_APPEARANCE, parseAppearance } from '../../../../admin/schema';
import { audit } from '../../../../admin/server/db';
import { fail, json, readJson } from '../../../../admin/server/http';
import { getAppearance, saveAppearance } from '../../../../admin/server/settings';

export const prerender = false;

export const GET: APIRoute = async () => json({ appearance: await getAppearance(), defaults: DEFAULT_APPEARANCE });

export const PUT: APIRoute = async ({ request, locals }) => {
  const parsed = parseAppearance(await readJson(request));
  if (!parsed.ok) return fail(422, 'Revisa la apariencia.', { errors: parsed.errors });
  await saveAppearance(parsed.value);
  await audit({ userId: locals.adminUser!.id, action: 'appearance_update' });
  return json({ appearance: parsed.value });
};
