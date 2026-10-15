import type { APIRoute } from 'astro';
import { audit } from '../../../../admin/server/db';
import { validateDefinition } from '../../../../admin/server/definition';
import { fail, json, readJson } from '../../../../admin/server/http';
import { getModuleByKey, insertModule, listModules } from '../../../../admin/server/modules';

export const prerender = false;

/** Todas las definiciones de módulos (activos e inactivos), para el constructor. */
export const GET: APIRoute = async () => json({ modules: await listModules() });

export const POST: APIRoute = async ({ request, locals }) => {
  const parsed = await validateDefinition(await readJson(request));
  if (!parsed.ok) return fail(422, 'Revisa la configuración del módulo.', { errors: parsed.errors });
  const def = parsed.value;

  if (await getModuleByKey(def.module_key, { activeOnly: false })) {
    return fail(409, `Ya existe un módulo con la clave "${def.module_key}".`, {
      errors: [`La clave "${def.module_key}" ya está en uso.`],
    });
  }

  const id = await insertModule(def);
  await audit({ userId: locals.adminUser!.id, action: 'module_create', moduleId: id, detail: { key: def.module_key } });
  return json({ id }, 201);
};
