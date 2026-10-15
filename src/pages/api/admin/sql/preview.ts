import type { APIRoute } from 'astro';
import { checkQuerySql, describeQuery, queryFields } from '../../../../admin/server/datos';
import { queryErrorMessage } from '../../../../admin/server/definition';
import { fail, json, readJson } from '../../../../admin/server/http';

export const prerender = false;

/** Prueba la consulta de un módulo: sus columnas (con el tipo detectado) y las primeras filas. */
export const POST: APIRoute = async ({ request }) => {
  const body = (await readJson(request)) as { sql?: unknown } | null;
  const sql = typeof body?.sql === 'string' ? body.sql : '';
  const error = checkQuerySql(sql);
  if (error) return fail(422, error);
  try {
    const { columns, rows } = await describeQuery(sql, 20);
    return json({ columns, rows, fields: queryFields(columns) });
  } catch (e) {
    const msg = queryErrorMessage(e);
    if (msg) return fail(422, msg);
    throw e;
  }
};
