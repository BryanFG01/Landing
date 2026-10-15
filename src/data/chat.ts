// Chat de ayuda de la landing: datos que recibe el navegador y reglas del pedido (precios, total y mensaje de
// WhatsApp). Puro: sin DOM ni Astro, lo usan el componente (al construir) y el script del chat (en el navegador).
import { bloque, conMarca, rich, type SiteContent } from './sitio';

export interface ChatProduct {
  id: string;
  nombre: string;
  detalle: string;
  precio: string;
  /** Precio por unidad en pesos, o null si se cobra por peso o no tiene cifra. */
  unitPrice: number | null;
}

export interface ChatQuestion {
  pregunta: string;
  /** HTML seguro (escapado por rich()). */
  respuestaHtml: string;
}

/** Todo lo que necesita el chat en el navegador (va como JSON en la página). */
export interface ChatData {
  nombre: string;
  bienvenida: string;
  logo: string;
  whatsapp: string;
  marca: string;
  preguntas: ChatQuestion[];
  productos: ChatProduct[];
  entregas: string[];
  pedirNota: boolean;
  mensaje: string;
}

export const MAX_QTY = 20;

/** "$20.000" → 20000. "$7.500 / lb" → null (se pesa: el total lo confirma el negocio). */
export function unitPriceOf(precio: string): number | null {
  if (/\/|\blb\b|libra|kg|kilo/i.test(precio)) return null;
  const match = /\d[\d.]*(?:,\d+)?/.exec(precio);
  if (!match) return null;
  const n = Number(match[0].replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

const pesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
/** 40000 → "$40.000" (sin espacio, como el resto de precios de la web). */
export const formatPesos = (n: number) => pesos.format(n).replace(/\s/g, '');

export function buildChatData(site: SiteContent, logo: string): ChatData {
  const c = site.chat;
  const faqs = bloque(site, 'preguntas');
  const productos = bloque(site, 'productos');
  const questions = [...c.preguntas, ...(c.usarFaq === 'si' && faqs.visible ? faqs.items : [])]
    .filter((q) => q.pregunta && q.respuesta)
    .map((q) => ({ pregunta: q.pregunta, respuestaHtml: rich(q.respuesta) }));
  const products =
    c.pedido === 'si' && productos.visible
      ? productos.items.map((p, i) => ({ id: String(i), nombre: p.nombre, detalle: p.detalle, precio: p.precio, unitPrice: unitPriceOf(p.precio) }))
      : [];
  return {
    nombre: c.nombre,
    bienvenida: conMarca(c.bienvenida, site),
    logo,
    whatsapp: site.contacto.whatsapp,
    marca: site.marca.nombre,
    preguntas: questions,
    productos: products,
    entregas: c.entregas,
    pedirNota: c.pedirNota === 'si',
    mensaje: c.mensaje,
  };
}

// ─── Pedido ──────────────────────────────────────────────────────────────────

export type Quantities = Record<string, number>;

export interface OrderDetails {
  nombre: string;
  direccion: string;
  entrega: string;
  nota: string;
}

export interface OrderSummary {
  lines: string[];
  /** Suma de lo que tiene precio fijo. */
  total: number;
  /** Hay productos que se cobran por peso: el total final lo confirma el negocio. */
  byWeight: boolean;
}

export const selectedProducts = (products: ChatProduct[], qty: Quantities) => products.filter((p) => (qty[p.id] ?? 0) > 0);

export function summarize(products: ChatProduct[], qty: Quantities): OrderSummary {
  const lines: string[] = [];
  let total = 0;
  let byWeight = false;
  for (const p of selectedProducts(products, qty)) {
    const n = qty[p.id];
    if (p.unitPrice === null) {
      byWeight = true;
      lines.push(`• ${n} × ${p.nombre} (${p.precio})`);
    } else {
      total += n * p.unitPrice;
      lines.push(`• ${n} × ${p.nombre} (${formatPesos(n * p.unitPrice)})`);
    }
  }
  return { lines, total, byWeight };
}

export function totalText(s: OrderSummary) {
  if (!s.total) return s.byWeight ? 'Total: según lo que pese.' : '';
  return s.byWeight ? `Total aproximado: ${formatPesos(s.total)} más lo que pese el pollo.` : `Total: ${formatPesos(s.total)}.`;
}

/** Mensaje de WhatsApp a partir de la plantilla del panel. */
export function orderMessage(data: ChatData, qty: Quantities, details: OrderDetails) {
  const s = summarize(data.productos, qty);
  const values: Record<string, string> = {
    marca: data.marca,
    pedido: s.lines.join('\n'),
    total: totalText(s),
    nombre: details.nombre,
    direccion: details.direccion,
    entrega: details.entrega || 'Lo antes posible',
    nota: details.nota ? `\nNota: ${details.nota}` : '',
  };
  return data.mensaje
    .replace(/\{(\w+)\}/g, (all, key: string) => values[key] ?? all)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export const whatsappUrl = (phone: string, text: string) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
