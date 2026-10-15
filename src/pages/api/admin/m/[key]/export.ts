import type { APIRoute } from 'astro';
import { toCsv } from '../../../../../admin/server/csv';
import { audit } from '../../../../../admin/server/db';
import { listQueryFrom } from '../../../../../admin/server/filters';
import { moduleFor, sourceFailure } from '../../../../../admin/server/guard';
import { fail } from '../../../../../admin/server/http';
import { allRows } from '../../../../../admin/server/sources';

export const prerender = false;

const MAX_ROWS = 10_000;

/** CSV con todas las filas que cumplen los filtros actuales (mismos parámetros que la lista). */
export const GET: APIRoute = async ({ params, url, locals }) => {
  const r = await moduleFor(params.key, locals.adminUser!, 'view');
  if (r instanceof Response) return r;
  const q = listQueryFrom(url, r.mod.page_size);
  if (!q) return fail(400, 'Filtros no válidos.');
  try {
    const rows = await allRows(r.mod, q, MAX_ROWS);
    const csv = await toCsv(r.mod, rows);
    await audit({ userId: locals.adminUser!.id, action: 'export', moduleId: r.mod.id, detail: { rows: rows.length } });
    const date = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${r.mod.module_key}-${date}.csv"`,
        'cache-control': 'no-store',
      },
    });
  } catch (e) {
    return sourceFailure(e);
  }
};
