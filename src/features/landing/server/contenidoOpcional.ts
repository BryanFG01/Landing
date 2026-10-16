// Contenido publicado para páginas que pueden vivir sin él (el login del panel toma de aquí colores y tipografías).

import { SITE_DEFAULTS, type SiteContent } from '../domain/sitio';
import { getSite } from './contenido';

/** Lo publicado o, si no se puede leer, el contenido de siempre. `contexto` etiqueta el aviso en los logs. */
export async function getSiteOrDefaults(contexto: string): Promise<SiteContent> {
  try {
    return await getSite();
  } catch (e) {
    console.warn(`[${contexto}] Sin el contenido publicado:`, e instanceof Error ? e.message : e);
    return SITE_DEFAULTS;
  }
}
