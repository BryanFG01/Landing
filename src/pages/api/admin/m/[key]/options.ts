import type { APIRoute } from 'astro';
import { fail, json } from '../../../../../admin/server/http';
import { getModuleByKey } from '../../../../../admin/server/modules';
import { relationOptions } from '../../../../../admin/server/records';

export const prerender = false;

/** Opciones de todos los campos de relación del módulo: { [campo]: [{ value, label }] }. */
export const GET: APIRoute = async ({ params }) => {
  const mod = await getModuleByKey(params.key ?? '');
  if (!mod) return fail(404, 'El módulo no existe.');
  const entries = await Promise.all(
    mod.fields.filter((f) => f.type === 'relation').map(async (f) => [f.key, await relationOptions(f)] as const),
  );
  return json({ options: Object.fromEntries(entries) });
};
