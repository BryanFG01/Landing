import { bloqueCss, type SiteContent } from '../domain/sitio';
import type { LandingBlock } from './Landing.types';

/**
 * Los bloques visibles, en el orden del panel, cada uno con su estilo. Con colores propios, el bloque va envuelto: el
 * envoltorio pinta el fondo y redefine los colores del tema (sin ellos, el estilo queda vacío y no se envuelve).
 */
export function landingView(site: SiteContent): LandingBlock[] {
  return site.bloques.filter((b) => b.visible).map((bloque) => ({ bloque, style: bloqueCss(bloque, site.tema) }));
}
