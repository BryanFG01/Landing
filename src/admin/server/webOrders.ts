// Pedidos hechos en el chat de la landing: se guardan como registros del módulo "Pedidos de la web".
// Es lo único que alguien sin sesión puede escribir en la base, así que lleva límite por IP y límite global.

import type { WebOrderRecord } from '../../data/chat';
import { audit, one } from './db';

export const WEB_ORDERS_MODULE = 'pedidos_web';
const PER_IP = { max: 5, minutes: 10 };
const GLOBAL = { max: 120, minutes: 60 };

const sha256 = async (s: string) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

/** La IP no se guarda tal cual: solo su huella, para poder limitar sin almacenar datos personales. */
export const ipFingerprint = (ip: string) => sha256(`pedido-web:${ip}`);

async function recentOrders(minutes: number, subject?: string) {
  const row = await one<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM admin.audit_log
     WHERE action = 'web_order' AND created_at >= now() - make_interval(mins => ?)${subject ? ' AND subject = ?' : ''}`,
    subject ? [minutes, subject] : [minutes],
  );
  return row?.n ?? 0;
}

/** true si esta IP (o la web en conjunto) ya hizo demasiados pedidos. */
export async function tooManyOrders(fingerprint: string) {
  const [mine, all] = await Promise.all([recentOrders(PER_IP.minutes, fingerprint), recentOrders(GLOBAL.minutes)]);
  return mine >= PER_IP.max || all >= GLOBAL.max;
}

/** Guarda el pedido. Devuelve su número, o null si el módulo ya no existe (se borró desde el constructor). */
export async function saveWebOrder(order: WebOrderRecord, fingerprint: string): Promise<number | null> {
  const mod = await one<{ id: number }>('SELECT id FROM admin.modules WHERE module_key = ?', [WEB_ORDERS_MODULE]);
  if (!mod) return null;
  const row = await one<{ id: number }>('INSERT INTO admin.records (module_id, data) VALUES (?, ?::jsonb) RETURNING id', [
    mod.id,
    JSON.stringify(order),
  ]);
  await audit({ action: 'web_order', moduleId: mod.id, recordId: row!.id, subject: fingerprint });
  return row!.id;
}
