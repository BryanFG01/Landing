import type { APIRoute } from 'astro';
import { audit } from '@/shared/server/db';
import { checkConsoleSql, runConsole } from '@/features/admin/core/server/datos';
import { queryErrorMessage } from '@/features/admin/module-editor/server/definition';
import { fail, json, readJson } from '@/shared/server/http';

export const prerender = false;

/**
 * Consola SQL (solo administradores, lo exige el middleware). Corre sobre el esquema datos con un rol sin acceso al
 * esquema admin. Sin `allow_write`, en una transacción de solo lectura.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const body = (await readJson(request)) as { sql?: unknown; allow_write?: unknown } | null;
  const sql = typeof body?.sql === 'string' ? body.sql : '';
  const allowWrite = body?.allow_write === true;
  if (sql.length > 50_000) return fail(413, 'La consulta es demasiado larga.');
  const blocked = checkConsoleSql(sql);
  if (blocked) return fail(422, blocked);

  const started = Date.now();
  try {
    const results = await runConsole(sql, allowWrite);
    await audit({ userId: locals.adminUser!.id, action: 'sql', detail: { sql: sql.slice(0, 2000), write: allowWrite } });
    return json({ results, ms: Date.now() - started });
  } catch (e) {
    const code = e && typeof e === 'object' && 'code' in e ? String(e.code) : '';
    // En solo lectura, cualquier intento de cambio llega como este error.
    if (code === '25006') return fail(422, 'Estás en modo solo lectura. Activa "Permitir cambios" para modificar datos.');
    const msg = queryErrorMessage(e);
    if (msg) {
      await audit({ userId: locals.adminUser!.id, action: 'sql_error', detail: { sql: sql.slice(0, 2000), error: msg } });
      return fail(422, msg.replace(/^Error en la consulta: /, ''));
    }
    throw e;
  }
};
