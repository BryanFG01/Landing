import { ogImage } from '@/features/landing/domain/imagenes';
import { FONTS, plain, temaCss, type SiteContent } from '@/features/landing/domain/sitio';
import type { Props } from './Layout.types';

const ROBOTS_INDEX = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const ROBOTS_NOINDEX = 'noindex, follow';

/**
 * Cabecera y partes del documento de la landing. `pathname` y `siteUrl` son Astro.url.pathname y Astro.site: se
 * pasan como argumentos para que esto siga siendo una función pura.
 */
export function layoutView(site: SiteContent, props: Props, pathname: string, siteUrl: URL | undefined) {
  const { marca, tema } = site;
  // Sin título ni descripción, los del SEO del panel (Sitio web).
  const {
    title = site.seo.titulo,
    description = plain(site.seo.descripcion),
    noindex = false,
    header = true,
  } = props;
  return {
    marca,
    tema,
    title,
    description,
    noindex,
    header,
    // Solo se cargan las dos tipografías elegidas en el panel.
    fonts: [...new Set([FONTS[tema.titulos].css, FONTS[tema.cuerpo].css])],
    canonical: new URL(pathname, siteUrl),
    ogUrl: new URL(ogImage.src, siteUrl),
    ogAlt: ogImage.alt,
    robots: noindex ? ROBOTS_NOINDEX : ROBOTS_INDEX,
    temaCss: temaCss(tema),
    hasChat: site.chat.activo === 'si',
  };
}
