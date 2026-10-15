import { defineMiddleware } from 'astro:middleware';
import { getSessionUser } from './admin/server/auth';
import { fail } from './admin/server/http';

// Rutas del admin que no piden sesión.
const PUBLIC = new Set(['/admin/login', '/api/admin/auth/login']);

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

  const user = await getSessionUser(ctx.cookies);
  if (user) ctx.locals.adminUser = user;
  else if (!PUBLIC.has(path)) {
    if (isApi) return fail(401, 'Tu sesión ha caducado. Vuelve a entrar.');
    return ctx.redirect(`/admin/login?next=${encodeURIComponent(path + ctx.url.search)}`);
  }

  const response = await next();
  try {
    response.headers.set('x-robots-tag', 'noindex, nofollow');
    if (isPage) response.headers.set('cache-control', 'no-store');
  } catch {
    // Algunas respuestas (redirecciones) tienen cabeceras inmutables.
  }
  return response;
});
