import type { APIRoute } from 'astro';
import { destroySession } from '../../../../admin/server/auth';
import { audit } from '../../../../admin/server/db';
import { json } from '../../../../admin/server/http';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, locals }) => {
  await destroySession(cookies);
  if (locals.adminUser) await audit({ userId: locals.adminUser.id, action: 'logout' });
  return json({ ok: true });
};
