// Contadores de la landing (visitas, clics en WhatsApp, chats abiertos) por día, en hora de Colombia. Lo escribe gente
// sin sesión, así que solo acepta los tres eventos conocidos y nunca guarda nada de quien visita.

import { exec, one } from '@/shared/server/db';

export const WEB_EVENTS = ['visita', 'whatsapp', 'chat'] as const;
export type WebEvent = (typeof WEB_EVENTS)[number];

export const isWebEvent = (v: unknown): v is WebEvent => typeof v === 'string' && (WEB_EVENTS as readonly string[]).includes(v);

const TODAY = "(now() AT TIME ZONE 'America/Bogota')::date";

/** Suma uno al contador de hoy. */
export async function countWebEvent(event: WebEvent) {
  await exec(
    `INSERT INTO admin.web_events (day, event, count) VALUES (${TODAY}, ?, 1)
     ON CONFLICT (day, event) DO UPDATE SET count = admin.web_events.count + 1`,
    [event],
  );
}

/** Totales de los últimos 7 días (hoy incluido). Ceros si la tabla aún no existe (falta la migración 0007). */
export async function webEventTotals() {
  try {
    const row = await one<Record<WebEvent, number>>(
      `SELECT
         coalesce(sum(count) FILTER (WHERE event = 'visita'), 0)::int AS visita,
         coalesce(sum(count) FILTER (WHERE event = 'whatsapp'), 0)::int AS whatsapp,
         coalesce(sum(count) FILTER (WHERE event = 'chat'), 0)::int AS chat
       FROM admin.web_events WHERE day > ${TODAY} - 7`,
    );
    return row ?? { visita: 0, whatsapp: 0, chat: 0 };
  } catch {
    return { visita: 0, whatsapp: 0, chat: 0 };
  }
}
