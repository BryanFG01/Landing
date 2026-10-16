import type { APIRoute } from 'astro';
import { parseRecordData } from '../../../../../admin/schema';
import { onCatalogChange } from '../../../../../admin/server/catalog';
import { audit } from '../../../../../admin/server/db';
import { moduleFor, sourceFailure } from '../../../../../admin/server/guard';
import { fail, json, readJson } from '../../../../../admin/server/http';
import {
  checkRelationValues,
  countReferences,
  deleteRow,
  getRow,
  parseRowId,
  updateRow,
} from '../../../../../admin/server/sources';

export const prerender = false;

const auditId = (id: string | number) => ({ recordId: typeof id === 'number' ? id : null, subject: String(id) });

export const GET: APIRoute = async ({ params, locals }) => {
  const r = await moduleFor(params.key, locals.adminUser!, 'view');
  if (r instanceof Response) return r;
  const id = parseRowId(r.mod, params.id);
  try {
    const record = id !== null && (await getRow(r.mod, id));
    if (!record) return fail(404, 'El registro no existe.');
    return json({ record });
  } catch (e) {
    return sourceFailure(e);
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const r = await moduleFor(params.key, locals.adminUser!, 'edit');
  if (r instanceof Response) return r;
  const { mod } = r;
  const id = parseRowId(mod, params.id);
  if (id === null) return fail(404, 'El registro no existe.');

  const parsed = parseRecordData(mod.fields, await readJson(request));
  if (!parsed.ok) return fail(422, 'Revisa los campos marcados.', { fieldErrors: parsed.errors });
  const relErrors = await checkRelationValues(mod, parsed.value);
  if (Object.keys(relErrors).length) return fail(422, 'Revisa los campos marcados.', { fieldErrors: relErrors });

  try {
    if (!(await updateRow(mod, id, parsed.value, locals.adminUser!.id))) return fail(404, 'El registro no existe.');
    await audit({ userId: locals.adminUser!.id, action: 'update', moduleId: mod.id, ...auditId(id) });
    return json({ ok: true, deploy: await onCatalogChange(mod, parsed.value) });
  } catch (e) {
    return sourceFailure(e);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const r = await moduleFor(params.key, locals.adminUser!, 'edit');
  if (r instanceof Response) return r;
  const { mod } = r;
  const id = parseRowId(mod, params.id);
  if (id === null) return fail(404, 'El registro no existe.');

  try {
    const refs = await countReferences(mod, id);
    if (refs) return fail(409, `No se puede borrar: ${refs} registro(s) de otros módulos apuntan a este.`);
    if (!(await deleteRow(mod, id))) return fail(404, 'El registro no existe.');
    await audit({ userId: locals.adminUser!.id, action: 'delete', moduleId: mod.id, ...auditId(id) });
    return json({ ok: true, deploy: await onCatalogChange(mod) });
  } catch (e) {
    return sourceFailure(e);
  }
};
