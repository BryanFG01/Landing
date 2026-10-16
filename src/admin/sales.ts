// Números de los pedidos de la web para el inicio del panel (sin base de datos: la consulta está en server/pages.ts).

export interface SalesStats {
  /** Pedidos recibidos hoy (hora de Colombia) y en los últimos 7 días. */
  today: number;
  week: number;
  pending: number;
  /** Suma de los totales de los últimos 7 días sin los cancelados (lo que se cobra por peso no tiene total). */
  weekTotal: number;
  /** Pedidos por día, los últimos 14 días (YYYY-MM-DD), del más antiguo al de hoy. */
  byDay: { day: string; n: number }[];
  /** Productos más pedidos en 30 días (por cantidad). */
  top: { nombre: string; cantidad: number }[];
  /** La web en los últimos 7 días: visitas (una por sesión), clics en WhatsApp y chats abiertos. */
  web: { visitas: number; whatsapp: number; chats: number };
}

/** Pedidos del chat por cada 100 visitas (1 decimal), o null sin visitas. */
export const conversion = (pedidos: number, visitas: number) => (visitas ? Math.round((pedidos / visitas) * 1000) / 10 : null);

// "2 × Panal de huevos colorados ($40.000)" → 2 y "Panal de huevos colorados". Admite la viñeta "• " de los mensajes.
const LINE = /^(?:•\s*)?(\d+)\s*[×x]\s*(.+?)(?:\s*\([^()]*\))?$/;

/** Productos más pedidos a partir del texto "productos" de cada pedido (una línea por producto). */
export function topProducts(productTexts: string[], limit = 5) {
  const totals = new Map<string, number>();
  for (const text of productTexts) {
    for (const line of text.split('\n')) {
      const m = LINE.exec(line.trim());
      if (!m) continue;
      const nombre = m[2].trim();
      totals.set(nombre, (totals.get(nombre) ?? 0) + Number(m[1]));
    }
  }
  return [...totals]
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre))
    .slice(0, limit);
}
