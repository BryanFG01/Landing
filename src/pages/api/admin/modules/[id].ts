import type { APIRoute } from 'astro';
import { parseModuleDefinition } from '../../../../admin/schema';
import { audit, exec } from '../../../../admin/server/db';
import { fail, json, readJson, toId } from '../../../../admin/server/http';
import {
  checkRelations,
  countRecords,
  getModuleById,
  getModuleByKey,
  modulesReferencing,
  updateModule,
} from '../../../../admin/server/modules';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const id = toId(params.id);
  const mod = id && (await getModuleById(id));
  if (!mod) return fail(404, 'El módulo no existe.');
  return json({ module: mod, record_count: await countRecords(mod.id) });
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const id = toId(params.id);
  const current = id && (await getModuleById(id));
  if (!current) return fail(404, 'El módulo no existe.');

  const parsed = parseModuleDefinition(await readJson(request));
  if (!parsed.ok) return fail(422, 'Revisa la configuración del módulo.', { errors: parsed.errors });
  const def = parsed.value;

  if (def.module_key !== current.module_key) {
    if (await getModuleByKey(def.module_key, { activeOnly: false })) {
      return fail(409, 'Clave en uso.', { errors: [`La clave "${def.module_key}" ya está en uso.`] });
    }
    const refs = await modulesReferencing(current.module_key);
    if (refs.length) {
      return fail(409, 'No se puede cambiar la clave.', {
        errors: [`Otros módulos apuntan a este: ${refs.map((m) => m.name).join(', ')}. Cambia primero esas relaciones.`],
      });
    }
  }
  const relErrors = await checkRelations(def);
  if (relErrors.length) return fail(422, 'Revisa las relaciones.', { errors: relErrors });

  await updateModule(current.id, def);
  await audit({ userId: locals.adminUser!.id, action: 'module_update', moduleId: current.id, detail: { key: def.module_key } });
  return json({ ok: true });
};

/** Borra el módulo y todos sus registros (ON DELETE CASCADE). */
export const DELETE: APIRoute = async ({ params, locals }) => {
  const id = toId(params.id);
  const mod = id && (await getModuleById(id));
  if (!mod) return fail(404, 'El módulo no existe.');
  const refs = await modulesReferencing(mod.module_key);
  if (refs.length) {
    return fail(409, `Otros módulos apuntan a este: ${refs.map((m) => m.name).join(', ')}.`);
  }
  await exec('DELETE FROM admin.modules WHERE id = ?', [mod.id]);
  await audit({ userId: locals.adminUser!.id, action: 'module_delete', moduleId: mod.id, detail: { key: mod.module_key } });
  return json({ ok: true });
};
