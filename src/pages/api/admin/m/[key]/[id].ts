import type { APIRoute } from 'astro';
import { parseRecordData } from '../../../../../admin/schema';
import { audit } from '../../../../../admin/server/db';
import { fail, json, readJson, toId } from '../../../../../admin/server/http';
import { getModuleByKey } from '../../../../../admin/server/modules';
import {
  checkRelationValues,
  countReferences,
  deleteRecord,
  getRecord,
  updateRecord,
} from '../../../../../admin/server/records';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const mod = await getModuleByKey(params.key ?? '');
  const id = toId(params.id);
  const record = mod && id && (await getRecord(mod, id));
  if (!record) return fail(404, 'El registro no existe.');
  return json({ record });
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const mod = await getModuleByKey(params.key ?? '');
  const id = toId(params.id);
  if (!mod || !id) return fail(404, 'El registro no existe.');

  const parsed = parseRecordData(mod.fields, await readJson(request));
  if (!parsed.ok) return fail(422, 'Revisa los campos marcados.', { fieldErrors: parsed.errors });
  const relErrors = await checkRelationValues(mod, parsed.value);
  if (Object.keys(relErrors).length) return fail(422, 'Revisa los campos marcados.', { fieldErrors: relErrors });

  // Los campos actuales se reemplazan enteros (un campo vaciado desaparece). Solo se conservan los datos de campos que
  // ya no existen en el módulo, por si se vuelven a añadir.
  const previous = await getRecord(mod, id);
  if (!previous) return fail(404, 'El registro no existe.');
  const current = new Set(mod.fields.map((f) => f.key));
  const kept = Object.fromEntries(
    Object.entries(previous).filter(([k]) => !current.has(k) && !['id', 'created_at', 'updated_at'].includes(k)),
  );
  await updateRecord(mod, id, { ...kept, ...parsed.value }, locals.adminUser!.id);
  await audit({ userId: locals.adminUser!.id, action: 'update', moduleId: mod.id, recordId: id });
  return json({ ok: true });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const mod = await getModuleByKey(params.key ?? '');
  const id = toId(params.id);
  if (!mod || !id) return fail(404, 'El registro no existe.');

  const refs = await countReferences(mod, id);
  if (refs) return fail(409, `No se puede borrar: ${refs} registro(s) de otros módulos apuntan a este.`);
  if (!(await deleteRecord(mod, id))) return fail(404, 'El registro no existe.');
  await audit({ userId: locals.adminUser!.id, action: 'delete', moduleId: mod.id, recordId: id });
  return json({ ok: true });
};
