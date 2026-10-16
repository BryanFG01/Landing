// Catálogo único: el bloque Productos de la landing (y el chat) toman los productos del módulo "productos" del panel
// cuando el bloque lo indica (origen = "modulo"). Aquí solo las reglas, sin base de datos: la lectura está en
// src/admin/server/catalog.ts.

import { formatPesos } from './chat';
import { bloque, type ProductoWeb, type SiteContent } from './sitio';

/** Módulo del panel del que sale el catálogo. */
export const CATALOG_MODULE = 'productos';

/** "Precio por" del módulo: cómo se muestra el precio. */
const POR: Record<string, string> = { libra: ' / lb', kilo: ' / kg' };

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Foto del registro: solo si es una subida del panel (se sirve en /media/<id>). */
function fotoDe(v: unknown, nombre: string) {
  const id = v && typeof v === 'object' ? (v as { id?: unknown }).id : undefined;
  return typeof id === 'string' && /^[0-9a-f-]{36}$/.test(id) ? { src: `/media/${id}`, alt: nombre } : { src: '', alt: '' };
}

/**
 * Un registro del módulo como producto de la web. Sin nombre o sin precio no se muestra (null). "disponible" en falso
 * lo deja como agotado: se ve en la web, pero no se puede pedir.
 */
export function productoDeRegistro(id: string | number, data: Record<string, unknown>): ProductoWeb | null {
  const nombre = text(data.nombre);
  const precio = typeof data.precio === 'number' ? data.precio : Number(data.precio);
  if (!nombre || !Number.isFinite(precio) || precio <= 0) return null;
  return {
    id: String(id),
    nombre,
    detalle: text(data.descripcion),
    precio: formatPesos(precio) + (POR[text(data.precio_por)] ?? ''),
    foto: fotoDe(data.foto, nombre),
    agotado: data.disponible === false,
  };
}

/** ¿El bloque Productos usa el catálogo del módulo? */
export const usaCatalogo = (site: SiteContent) => bloque(site, 'productos')?.origen === 'modulo';

/**
 * El contenido con los productos del catálogo en el bloque Productos (si el bloque lo usa). Sin catálogo (null: la base
 * no respondió o el módulo no existe) se queda con la lista del bloque, para no dejar la web sin productos.
 */
export function aplicarCatalogo(site: SiteContent, catalogo: ProductoWeb[] | null): SiteContent {
  if (!catalogo || !usaCatalogo(site)) return site;
  return {
    ...site,
    bloques: site.bloques.map((b) => (b.tipo === 'productos' ? { ...b, items: catalogo } : b)),
  };
}
