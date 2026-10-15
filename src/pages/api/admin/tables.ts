import type { APIRoute } from 'astro';
import { columnTypeOf, listTables, suggestField, type RelationTargets } from '../../../admin/server/datos';
import { json } from '../../../admin/server/http';
import { listModules } from '../../../admin/server/modules';

export const prerender = false;

/**
 * Para las claves foráneas: cada tabla que ya tiene un módulo, con el campo de texto que se muestra al elegir una fila
 * (el primero del módulo; si no tiene, la clave primaria).
 */
async function relationTargets(): Promise<RelationTargets> {
  const targets: RelationTargets = new Map();
  for (const m of await listModules()) {
    if (m.source_type !== 'table' || !m.source || targets.has(m.source)) continue;
    const label = m.fields.find((f) => f.type === 'text')?.key ?? m.source_pk ?? 'id';
    targets.set(m.source, { module_key: m.module_key, label });
  }
  return targets;
}

/**
 * Tablas y vistas del esquema datos con sus columnas, el formato sugerido de cada una y los campos de formulario
 * sugeridos (para crear un módulo sobre la tabla). Los campos salen también de lo que diga el SQL: COMMENT ON COLUMN,
 * CHECK ... IN (...), ENUM y REFERENCES.
 */
export const GET: APIRoute = async () => {
  const [tables, relations] = await Promise.all([listTables(), relationTargets()]);
  return json({
    tables: tables.map((t) => ({
      ...t,
      columns: t.columns.map((c) => ({ ...c, data_type: columnTypeOf(c) })),
      suggested_fields: t.columns
        .filter((c) => !(c.pk && (c.identity || c.default?.startsWith('nextval('))))
        .map((c) => suggestField(c, relations))
        .filter(Boolean),
    })),
  });
};
