import type { APIRoute } from 'astro';
import { buildChatData, parseWebOrder } from '@/features/landing/domain/chat';
import { getSite } from '@/features/landing/server/contenido';
import { fail, json, readJson } from '@/shared/server/http';
import { notifyNewOrder } from '@/features/admin/orders/server/notify';
import { ipFingerprint, saveWebOrder, tooManyOrders, WEB_ORDERS_MODULE } from '@/features/admin/orders/server/webOrders';

export const prerender = false;

/**
 * Pedido hecho en el chat de la landing (sin sesión). Se valida contra lo publicado (productos, precios, entregas) y se
 * guarda como Pendiente en "Pedidos de la web". El chat abre WhatsApp igual, pase lo que pase aquí.
 */
/** IP de quien pide: la que pone Vercel delante, o la de la conexión (en local). */
function clientIp(request: Request, address: () => string) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  try {
    return address();
  } catch {
    return 'desconocida';
  }
}

export const POST: APIRoute = async (ctx) => {
  const { request, url } = ctx;
  // Solo desde la propia web.
  if (request.headers.get('origin') !== url.origin) return fail(403, 'Origen no permitido.');

  const site = await getSite();
  if (site.chat.registrar !== 'si') return json({ saved: false });

  const parsed = parseWebOrder(await readJson(request), buildChatData(site, ''));
  // A los bots se les responde como si nada, para no darles pistas.
  if (!parsed.ok && parsed.bot) return json({ saved: true });
  if (!parsed.ok) return fail(422, 'Revisa el pedido.', { errors: parsed.errors });

  const fingerprint = await ipFingerprint(clientIp(request, () => ctx.clientAddress));
  if (await tooManyOrders(fingerprint)) return fail(429, 'Demasiados pedidos seguidos. Escríbenos por WhatsApp.');

  const id = await saveWebOrder(parsed.value, fingerprint);
  // Aviso al celular del negocio (si está configurado Telegram). No frena la respuesta más de 3 s ni la hace fallar.
  if (id) await notifyNewOrder(id, parsed.value, `${url.origin}/admin/m/${WEB_ORDERS_MODULE}`);
  return json({ saved: id !== null, id }, id ? 201 : 200);
};
