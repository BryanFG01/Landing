import type { Bloque, SiteContent } from '../domain/sitio';

export interface Props {
  site: SiteContent;
}

/** Un bloque visible con el estilo de su envoltorio ('' si usa los colores del tema). */
export interface LandingBlock {
  bloque: Bloque;
  style: string;
}
