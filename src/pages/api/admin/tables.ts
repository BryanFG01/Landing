import type { APIRoute } from 'astro';
import { columnTypeOf, listTables, suggestField } from '../../../admin/server/datos';
import { json } from '../../../admin/server/http';

export const prerender = false;

/**
 * Tablas y vistas del esquema datos con sus columnas, el formato sugerido de cada una y los campos de formulario
 * sugeridos (para crear un módulo sobre la tabla).
 */
export const GET: APIRoute = async () => {
  const tables = await listTables();
  return json({
    tables: tables.map((t) => ({
      ...t,
      columns: t.columns.map((c) => ({ ...c, data_type: columnTypeOf(c) })),
      suggested_fields: t.columns
        .filter((c) => !(c.pk && (c.identity || c.default?.startsWith('nextval('))))
        .map(suggestField)
        .filter(Boolean),
    })),
  });
};
