import { defineMiddleware } from 'astro:middleware';
import { getSessionUser } from './admin/server/auth';
import { DbConfigError } from './admin/server/db';
import { fail } from './admin/server/http';

// Rutas del admin que no piden sesión.
const PUBLIC = new Set(['/admin/login', '/api/admin/auth/login']);
// API que solo pueden usar los administradores (configurar el panel). Los usuarios solo usan /m/<módulo>, /files,
// /nav y /dashboard, y allí se comprueba el permiso de cada módulo.
const ADMIN_ONLY = /^\/api\/admin\/(modules|groups|users|sql|tables|settings)(\/|$)/;

/** Mensaje para el panel cuando la base falla. El detalle va a los logs (en Vercel: Logs del proyecto). */
function dbFailure(error: unknown, isApi: boolean) {
  console.error('[admin] error de base de datos:', error);
  const message =
    error instanceof DbConfigError
      ? 'El panel no está configurado: falta la conexión a la base de datos (DATABASE_URL).'
      : 'No se pudo conectar con la base de datos. Inténtalo de nuevo en un momento.';
  if (isApi) return fail(503, message);
  return new Response(message, { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  const path = ctx.url.pathname.replace(/\/+$/, '') || '/';
  const isPage = path === '/admin' || path.startsWith('/admin/');
  const isApi = path.startsWith('/api/admin/');
  // La landing (prerenderizada) no pasa por aquí en ejecución.
  if (ctx.isPrerendered || (!isPage && !isApi)) return next();

  // Las peticiones que cambian datos deben venir del propio sitio (la cookie es SameSite=Lax, esto lo refuerza).
  if (isApi && ctx.request.method !== 'GET' && ctx.request.headers.get('origin') !== ctx.url.origin) {
    return fail(403, 'Origen no permitido.');
  }

  let response: Response;
  try {
    const user = await getSessionUser(ctx.cookies);
    if (user) ctx.locals.adminUser = user;
    else if (!PUBLIC.has(path)) {
      if (isApi) return fail(401, 'Tu sesión ha caducado. Vuelve a entrar.');
      return ctx.redirect(`/admin/login?next=${encodeURIComponent(path + ctx.url.search)}`);
    }
    if (user && user.role !== 'admin' && ADMIN_ONLY.test(path)) {
      return fail(403, 'Esta parte del panel es solo para administradores.');
    }
    response = await next();
  } catch (error) {
    // Base sin configurar o caída: mensaje claro en vez de un 500 vacío.
    return dbFailure(error, isApi);
  }

  try {
    response.headers.set('x-robots-tag', 'noindex, nofollow');
    if (isPage) response.headers.set('cache-control', 'no-store');
  } catch {
    // Algunas respuestas (redirecciones) tienen cabeceras inmutables.
  }
  return response;
});
