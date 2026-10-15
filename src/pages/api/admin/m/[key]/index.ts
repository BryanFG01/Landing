import type { APIRoute } from 'astro';
import { parseRecordData } from '../../../../../admin/schema';
import { audit } from '../../../../../admin/server/db';
import { listQueryFrom } from '../../../../../admin/server/filters';
import { moduleFor, sourceFailure } from '../../../../../admin/server/guard';
import { fail, json, readJson } from '../../../../../admin/server/http';
import { checkRelationValues, insertRow, listRows } from '../../../../../admin/server/sources';

export const prerender = false;

/**
 * Lista paginada. Query: page, page_size, sort, dir, filters (JSON con los valores del filtro, por nombre de filtro).
 * La respuesta sigue el contrato `type: table` (columnConfigs + data + total_rows).
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
  const r = await moduleFor(params.key, locals.adminUser!, 'view');
  if (r instanceof Response) return r;
  const q = listQueryFrom(url, r.mod.page_size);
  if (!q) return fail(400, 'Filtros no válidos.');
  try {
    return json(await listRows(r.mod, q));
  } catch (e) {
    return sourceFailure(e);
  }
};

export const POST: APIRoute = async ({ params, request, locals }) => {
  const r = await moduleFor(params.key, locals.adminUser!, 'edit');
  if (r instanceof Response) return r;
  const { mod } = r;

  const parsed = parseRecordData(mod.fields, await readJson(request));
  if (!parsed.ok) return fail(422, 'Revisa los campos marcados.', { fieldErrors: parsed.errors });
  const relErrors = await checkRelationValues(mod, parsed.value);
  if (Object.keys(relErrors).length) return fail(422, 'Revisa los campos marcados.', { fieldErrors: relErrors });

  try {
    const id = await insertRow(mod, parsed.value, locals.adminUser!.id);
    await audit({
      userId: locals.adminUser!.id,
      action: 'create',
      moduleId: mod.id,
      recordId: typeof id === 'number' ? id : null,
      subject: String(id),
    });
    return json({ id }, 201);
  } catch (e) {
    return sourceFailure(e);
  }
};
