import type { APIRoute } from 'astro';
import { parseRecordData } from '../../../../../admin/schema';
import { audit } from '../../../../../admin/server/db';
import { fail, json, readJson } from '../../../../../admin/server/http';
import { getModuleByKey } from '../../../../../admin/server/modules';
import { checkRelationValues, insertRecord, listRecords } from '../../../../../admin/server/records';

export const prerender = false;

/**
 * Lista paginada de registros. Query: page, page_size, sort, dir, filters (JSON con los valores del filtro,
 * por nombre de filtro). La respuesta sigue el contrato `type: table` (columnConfigs + data + total_rows).
 */
export const GET: APIRoute = async ({ params, url }) => {
  const mod = await getModuleByKey(params.key ?? '');
  if (!mod) return fail(404, 'El módulo no existe.');

  let filters: Record<string, unknown> = {};
  try {
    const raw = url.searchParams.get('filters');
    if (raw) filters = JSON.parse(raw);
  } catch {
    return fail(400, 'Filtros no válidos.');
  }

  return json(
    await listRecords(mod, {
      page: Number(url.searchParams.get('page')) || 1,
      pageSize: Number(url.searchParams.get('page_size')) || mod.page_size,
      sort: url.searchParams.get('sort') ?? undefined,
      dir: url.searchParams.get('dir') === 'asc' ? 'asc' : 'desc',
      filters: filters && typeof filters === 'object' ? filters : {},
    }),
  );
};

export const POST: APIRoute = async ({ params, request, locals }) => {
  const mod = await getModuleByKey(params.key ?? '');
  if (!mod) return fail(404, 'El módulo no existe.');

  const parsed = parseRecordData(mod.fields, await readJson(request));
  if (!parsed.ok) return fail(422, 'Revisa los campos marcados.', { fieldErrors: parsed.errors });
  const relErrors = await checkRelationValues(mod, parsed.value);
  if (Object.keys(relErrors).length) return fail(422, 'Revisa los campos marcados.', { fieldErrors: relErrors });

  const id = await insertRecord(mod, parsed.value, locals.adminUser!.id);
  await audit({ userId: locals.adminUser!.id, action: 'create', moduleId: mod.id, recordId: id });
  return json({ id }, 201);
};
