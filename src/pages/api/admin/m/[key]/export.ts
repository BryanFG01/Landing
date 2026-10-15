import type { APIRoute } from 'astro';
import { toCsv, toXlsx } from '../../../../../admin/server/csv';
import { audit } from '../../../../../admin/server/db';
import { listQueryFrom } from '../../../../../admin/server/filters';
import { moduleFor, sourceFailure } from '../../../../../admin/server/guard';
import { fail } from '../../../../../admin/server/http';
import { allRows } from '../../../../../admin/server/sources';

export const prerender = false;

const MAX_ROWS = 10_000;

/**
 * Todas las filas que cumplen los filtros actuales (mismos parámetros que la lista). Por defecto en Excel (.xlsx);
 * con ?formato=csv, en CSV.
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
  const r = await moduleFor(params.key, locals.adminUser!, 'view');
  if (r instanceof Response) return r;
  const q = listQueryFrom(url, r.mod.page_size);
  if (!q) return fail(400, 'Filtros no válidos.');
  const csv = url.searchParams.get('formato') === 'csv';
  try {
    const rows = await allRows(r.mod, q, MAX_ROWS);
    const body = csv ? await toCsv(r.mod, rows) : await toXlsx(r.mod, rows);
    await audit({ userId: locals.adminUser!.id, action: 'export', moduleId: r.mod.id, detail: { rows: rows.length, csv } });
    const date = new Date().toISOString().slice(0, 10);
    return new Response(typeof body === 'string' ? body : new Blob([body as Uint8Array<ArrayBuffer>]), {
      headers: {
        'content-type': csv
          ? 'text/csv; charset=utf-8'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'content-disposition': `attachment; filename="${r.mod.module_key}-${date}.${csv ? 'csv' : 'xlsx'}"`,
        'cache-control': 'no-store',
      },
    });
  } catch (e) {
    return sourceFailure(e);
  }
};
