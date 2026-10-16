import type { APIRoute } from 'astro';
import { moduleFor } from '@/features/admin/core/server/guard';
import { json } from '@/shared/server/http';

export const prerender = false;

/** Definición de un módulo activo (campos, columnas, filtros) y el permiso del usuario, para pintar su vista. */
export const GET: APIRoute = async ({ params, locals }) => {
  const r = await moduleFor(params.key, locals.adminUser!, 'view');
  if (r instanceof Response) return r;
  // El SQL de las consultas solo lo ven quienes pueden configurar módulos.
  const mod = locals.adminUser!.role === 'admin' ? r.mod : { ...r.mod, source: null };
  return json({ module: mod, access: r.mod.source_type === 'query' ? 'view' : r.access });
};
