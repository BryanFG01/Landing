import { imageUrl } from '../domain/assets';
import { buildChatData } from '../domain/chat';
import type { SiteContent } from '../domain/sitio';

/** Datos del chat para el script (JSON listo para incrustar) y el lado de la pantalla donde va el botón. */
export function chatBotView(site: SiteContent) {
  const data = buildChatData(site, imageUrl(site.marca.logo.src));
  return {
    data,
    // Sin "<" el JSON no puede cerrar la etiqueta <script> que lo contiene.
    json: JSON.stringify(data).replaceAll('<', '\\u003c'),
    side: site.chat.posicion === 'izquierda' ? 'left' : 'right',
  };
}
