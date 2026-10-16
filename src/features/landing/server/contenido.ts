// Contenido de la landing para los componentes de Astro.
//
// La landing se prerenderiza: al construirse lee lo publicado desde el panel (admin.settings 'site_published'). Sin
// base configurada (DATABASE_URL vacía) usa SITE_DEFAULTS. Si la base está configurada pero falla, el build falla a
// propósito: es mejor no desplegar que publicar el contenido por defecto encima del bueno.
//
// La vista previa del panel (/admin/vista-previa) pone el borrador en Astro.locals.sitePreview.

import type { AstroGlobal } from 'astro';
import { aplicarCatalogo, usaCatalogo } from '../domain/catalogo';
import { parseSite, SITE_DEFAULTS, type SiteContent } from '../domain/sitio';

let published: Promise<SiteContent> | undefined;

async function loadPublished(): Promise<SiteContent> {
  const { DbConfigError, one } = await import('@/shared/server/db');
  try {
    const row = await one<{ value: unknown }>("SELECT value FROM admin.settings WHERE key = 'site_published'");
    if (!row) return SITE_DEFAULTS;
    // Con el catálogo único, los productos salen del módulo del panel (src/data/catalogo.ts).
    const site = parseSite(row.value).value;
    if (!usaCatalogo(site)) return site;
    const { loadCatalog } = await import('@/features/admin/site-editor/server/catalog');
    return aplicarCatalogo(site, await loadCatalog());
  } catch (e) {
    if (e instanceof DbConfigError) {
      console.warn('[sitio] Sin DATABASE_URL: se usa el contenido por defecto.');
      return SITE_DEFAULTS;
    }
    throw new Error(`[sitio] No se pudo leer el contenido publicado: ${(e as Error).message}`);
  }
}

/** Contenido publicado. En el build se lee una vez; en desarrollo, en cada petición (para ver lo recién publicado). */
export function getSite(): Promise<SiteContent> {
  if (import.meta.env.DEV) return loadPublished();
  published ??= loadPublished();
  return published;
}

/** El borrador en la vista previa; si no, lo publicado. */
export function siteFor(astro: Pick<AstroGlobal, 'locals'>): Promise<SiteContent> {
  return astro.locals.sitePreview ? Promise.resolve(astro.locals.sitePreview) : getSite();
}
