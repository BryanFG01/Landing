import type { APIRoute } from 'astro';
import { audit } from '../../../../admin/server/db';
import { json } from '../../../../admin/server/http';
import { publishDraft, triggerDeploy } from '../../../../admin/server/site';

export const prerender = false;

/** Publica el borrador y lanza el despliegue de la landing en Vercel (si hay Deploy Hook). */
export const POST: APIRoute = async ({ locals }) => {
  await publishDraft(locals.adminUser!.id);
  const deploy = await triggerDeploy();
  await audit({ userId: locals.adminUser!.id, action: 'site_publish', detail: { deploy } });
  return json({ ok: true, deploy });
};
