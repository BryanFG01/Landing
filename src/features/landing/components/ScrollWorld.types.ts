import type { BloquePaseo, Parada, SiteContent } from '../domain/sitio';
import type { EstiloConItems } from './stops/types';

export interface Props {
  bloque: BloquePaseo;
  site: SiteContent;
}

/** Una parada lista para pintar: su ancla, su parte del vídeo y lo que decide su marcado. */
export interface ParadaVista extends Parada {
  id: string;
  /** Solo la primera lleva el vídeo; las demás lo continúan. */
  clip: string;
  auto: boolean;
  continua: boolean;
  isFirst: boolean;
  /** Antetítulo que pinta Stop (la primera lo mete en su h1 y aquí va vacío). */
  stopEyebrow: string | undefined;
  spy: string | undefined;
  /** Antetítulo del h1 de la primera parada: el suyo o la marca y el lema. */
  heroEyebrow: string;
  textoHtml: string;
  notaHtml: string;
  /** Estilo con el que se pintan los datos; null si la parada no los muestra. */
  itemsStyle: EstiloConItems | null;
  hasWhatsappButton: boolean;
  hasProductsLink: boolean;
}

export interface ScrollWorldView {
  pedir: string;
  chatOnRight: boolean;
  paradas: ParadaVista[];
}
