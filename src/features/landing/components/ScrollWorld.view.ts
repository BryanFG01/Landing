import { links, rich, type BloquePaseo, type Marca, type Parada, type SiteContent } from '../domain/sitio';
import type { ParadaVista, ScrollWorldView } from './ScrollWorld.types';
import type { EstiloConItems } from './stops/types';

// Lista cerrada (y no "todo salvo texto"): un estilo desconocido no pinta datos, como antes.
const ESTILOS_CON_ITEMS = new Set<string>(['chips', 'cifras', 'tarjetas', 'numero', 'pasos'] satisfies EstiloConItems[]);

const isEstiloConItems = (estilo: string): estilo is EstiloConItems => ESTILOS_CON_ITEMS.has(estilo);

/** El estilo con el que se pintan los datos, o null si no hay nada que pintar. */
function itemsStyleOf(p: Parada): EstiloConItems | null {
  if (!isEstiloConItems(p.estilo)) return null;
  // El número destacado solo usa el primer dato; los demás estilos, la lista entera.
  const hasItems = p.estilo === 'numero' ? Boolean(p.items[0]) : p.items.length > 0;
  return hasItems ? p.estilo : null;
}

function paradaVista(p: Parada, i: number, video: string, marca: Marca): ParadaVista {
  const isFirst = i === 0;
  return {
    ...p,
    id: isFirst ? 'inicio' : `parada-${i + 1}`,
    clip: isFirst ? video : '',
    auto: isFirst && !!video,
    continua: i > 0 && !!video,
    isFirst,
    stopEyebrow: isFirst ? undefined : p.eyebrow || undefined,
    spy: isFirst ? '#inicio' : undefined,
    heroEyebrow: p.eyebrow || `${marca.nombre} · ${marca.lema}`,
    textoHtml: p.texto ? rich(p.texto) : '',
    notaHtml: p.nota ? rich(p.nota) : '',
    itemsStyle: itemsStyleOf(p),
    hasWhatsappButton: p.boton === 'whatsapp',
    hasProductsLink: p.boton === 'productos',
  };
}

/**
 * Datos del paseo listos para pintar. El vídeo arranca en la primera parada y las demás lo continúan: se ve de corrido,
 * sin cortes. Sin vídeo, el póster.
 */
export function scrollWorldView(bloque: BloquePaseo, site: SiteContent): ScrollWorldView {
  return {
    pedir: links(site).pedir,
    // El texto "desliza" va abajo a la derecha: si el botón del chat también, se sube para no taparse.
    chatOnRight: site.chat.activo === 'si' && site.chat.posicion === 'derecha',
    paradas: bloque.paradas.map((p, i) => paradaVista(p, i, bloque.video, site.marca)),
  };
}
