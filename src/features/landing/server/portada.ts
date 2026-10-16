// Datos de la portada (src/pages/index.astro): el contenido publicado y su JSON-LD.

import { structuredData } from '../domain/schema';
import type { SiteContent } from '../domain/sitio';
import { getSite } from './contenido';

export interface Portada {
  content: SiteContent;
  /** JSON-LD listo para incrustar: sin "<", no puede cerrar la etiqueta <script> que lo contiene. */
  jsonLd: string;
}

/** `siteUrl` es Astro.site: sin él no hay URLs absolutas para el JSON-LD y el build debe fallar. */
export async function loadPortada(siteUrl: URL | undefined): Promise<Portada> {
  if (!siteUrl) throw new Error('Falta site en astro.config.mjs');
  const content = await getSite();
  const jsonLd = JSON.stringify(structuredData(siteUrl, content)).replaceAll('<', '\\u003c');
  return { content, jsonLd };
}
