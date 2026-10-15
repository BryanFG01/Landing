import type { APIRoute } from 'astro';
import { fail, json } from '../../../../../admin/server/http';
import { getModuleByKey } from '../../../../../admin/server/modules';

export const prerender = false;

/** Definición de un módulo activo (campos, columnas, filtros) para pintar su vista. */
export const GET: APIRoute = async ({ params }) => {
  const mod = await getModuleByKey(params.key ?? '');
  if (!mod) return fail(404, 'Este módulo no existe o está desactivado.');
  return json({ module: mod });
};
