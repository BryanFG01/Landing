// Aviso de pedidos nuevos de la web fuera del panel: por Telegram, si están TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID.
// Es un extra: si falta la configuración o Telegram no responde, el pedido ya está guardado y no se hace nada más.

import { getSecret } from 'astro:env/server';
import type { WebOrderRecord } from '@/features/landing/domain/chat';

const TIMEOUT_MS = 3000;

/** Texto del aviso: lo justo para atender el pedido desde el celular. */
export function orderNotice(id: number, o: WebOrderRecord, panelUrl: string) {
  return [
    `Pedido nuevo #${id} (web)`,
    '',
    o.productos,
    o.total ? `Total: $${o.total.toLocaleString('es-CO')}` : 'Total: según lo que pese',
    '',
    `Cliente: ${o.cliente}`,
    `WhatsApp: ${o.telefono}`,
    `Dirección: ${o.direccion}`,
    ...(o.entrega ? [`Entrega: ${o.entrega}`] : []),
    ...(o.nota ? [`Nota: ${o.nota}`] : []),
    '',
    panelUrl,
  ].join('\n');
}

/** Envía el aviso. true si Telegram lo aceptó; false si no está configurado o falló (nunca lanza). */
export async function notifyNewOrder(id: number, order: WebOrderRecord, panelUrl: string) {
  const token = getSecret('TELEGRAM_BOT_TOKEN');
  const chatId = getSecret('TELEGRAM_CHAT_ID');
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: orderNotice(id, order, panelUrl), disable_web_page_preview: true }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return res.ok;
  } catch (e) {
    console.error('[pedidos] el aviso por Telegram falló:', e);
    return false;
  }
}
