import type { APIRoute } from 'astro';
import { DEFAULT_APPEARANCE, parseAppearance } from '@/features/admin/core/domain/schema';
import { audit } from '@/shared/server/db';
import { fail, json, readJson } from '@/shared/server/http';
import { getAppearance, saveAppearance } from '@/features/admin/appearance/server/settings';

export const prerender = false;

export const GET: APIRoute = async () => json({ appearance: await getAppearance(), defaults: DEFAULT_APPEARANCE });

export const PUT: APIRoute = async ({ request, locals }) => {
  const parsed = parseAppearance(await readJson(request));
  if (!parsed.ok) return fail(422, 'Revisa la apariencia.', { errors: parsed.errors });
  await saveAppearance(parsed.value);
  await audit({ userId: locals.adminUser!.id, action: 'appearance_update' });
  return json({ appearance: parsed.value });
};
