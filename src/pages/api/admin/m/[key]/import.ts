import type { APIRoute } from 'astro';
import { parseRecordData } from '@/features/admin/core/domain/schema';
import { fieldOptions, importValue } from '@/features/admin/records/server/csv';
import { audit } from '@/shared/server/db';
import { moduleFor, sourceFailure } from '@/features/admin/core/server/guard';
import { fail, json, readJson } from '@/shared/server/http';
import { onCatalogChange } from '@/features/admin/site-editor/server/catalog';
import { checkRelationValues, insertRows } from '@/features/admin/core/server/sources';

export const prerender = false;

const MAX_ROWS = 5000;

/**
 * Importa filas: { rows: [{ <clave de campo>: "texto de la celda" }] }. El navegador ya ha emparejado las columnas
 * del CSV con los campos. Si alguna fila no es válida no se guarda ninguna y se devuelve la lista de errores.
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
  const r = await moduleFor(params.key, locals.adminUser!, 'edit');
  if (r instanceof Response) return r;
  const { mod } = r;

  const body = (await readJson(request)) as { rows?: unknown } | null;
  const rows = Array.isArray(body?.rows) ? (body.rows as Record<string, unknown>[]) : [];
  if (!rows.length) return fail(400, 'El archivo no tiene filas.');
  if (rows.length > MAX_ROWS) return fail(413, `Como mucho ${MAX_ROWS} filas por importación.`);

  const options = await fieldOptions(mod);
  const valid: Record<string, unknown>[] = [];
  const errors: string[] = [];
  for (const [i, raw] of rows.entries()) {
    const values = Object.fromEntries(
      mod.fields.map((f) => [f.key, importValue(f, typeof raw?.[f.key] === 'string' ? (raw[f.key] as string) : '', options.get(f.key))]),
    );
    const parsed = parseRecordData(mod.fields, values);
    // Fila 1 = encabezados del archivo.
    if (!parsed.ok) {
      const detail = Object.entries(parsed.errors)
        .map(([k, msg]) => `${mod.fields.find((f) => f.key === k)?.label ?? k}: ${msg}`)
        .join(' · ');
      errors.push(`Fila ${i + 2}: ${detail}`);
    } else {
      // Las relaciones se comprueban contra las opciones ya cargadas; solo las que no aparecen van a la base.
      const unknown = mod.fields.filter(
        (f) =>
          f.type === 'relation' &&
          parsed.value[f.key] !== undefined &&
          !options.get(f.key)?.some((o) => o.value === String(parsed.value[f.key])),
      );
      const rel = unknown.length ? await checkRelationValues({ ...mod, fields: unknown }, parsed.value) : {};
      if (Object.keys(rel).length) {
        errors.push(`Fila ${i + 2}: ${unknown.map((f) => f.label).join(', ')} no coincide con ningún registro.`);
      } else valid.push(parsed.value);
    }
    if (errors.length >= 50) break;
  }
  if (errors.length) return fail(422, 'Hay filas con errores. No se importó nada.', { errors });

  try {
    await insertRows(mod, valid, locals.adminUser!.id);
  } catch (e) {
    return sourceFailure(e);
  }
  await audit({ userId: locals.adminUser!.id, action: 'import', moduleId: mod.id, detail: { rows: valid.length } });
  // Un solo despliegue para toda la importación (las importaciones no traen fotos).
  return json({ inserted: valid.length, deploy: await onCatalogChange(mod) });
};
