// Imágenes del proyecto que el contenido editable nombra como "asset:<clave>" (ver ASSET_KEYS en sitio.ts). Pasan por
// astro:assets (AVIF/WebP y tamaños). Las que se suben desde el panel son "/media/<id>" y se sirven tal cual.
import type { ImageMetadata } from 'astro';
import logo from '../assets/marca/logo.png';
import pollos from '../assets/paseo/pollos.webp';
import bascula from '../assets/paseo/bascula.webp';
import amanecer from '../assets/photos/0-amanecer.webp';
import gallinas from '../assets/photos/1-gallinas.webp';
import nidos from '../assets/photos/2-nidos.webp';
import recogida from '../assets/photos/3-recogida.webp';
import seleccion from '../assets/photos/5-seleccion.webp';
import entrega from '../assets/photos/6-entrega.webp';
import type { ASSET_KEYS } from './sitio';

export const ASSETS: Record<(typeof ASSET_KEYS)[number], ImageMetadata> = {
  logo,
  pollos,
  bascula,
  amanecer,
  gallinas,
  nidos,
  recogida,
  seleccion,
  entrega,
};

/** La imagen del proyecto si `src` es "asset:<clave>"; si no, null. */
export function assetFor(src: string): ImageMetadata | null {
  return src.startsWith('asset:') ? (ASSETS[src.slice(6) as keyof typeof ASSETS] ?? null) : null;
}

/** URL utilizable en cualquier sitio (JSON-LD, poster de video…). */
export const imageUrl = (src: string) => assetFor(src)?.src ?? src;
