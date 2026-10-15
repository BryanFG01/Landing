import type { APIRoute } from 'astro';
import { moduleFor } from '../../../../../admin/server/guard';
import { json } from '../../../../../admin/server/http';
import { relationOptions } from '../../../../../admin/server/sources';

export const prerender = false;

/** Opciones de todos los campos de relación del módulo: { [campo]: [{ value, label }] }. */
export const GET: APIRoute = async ({ params, locals }) => {
  const r = await moduleFor(params.key, locals.adminUser!, 'view');
  if (r instanceof Response) return r;
  const entries = await Promise.all(
    r.mod.fields.filter((f) => f.type === 'relation').map(async (f) => [f.key, await relationOptions(f)] as const),
  );
  return json({ options: Object.fromEntries(entries) });
};
