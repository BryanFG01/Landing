import type { APIRoute } from 'astro';
import { countWebEvent, isWebEvent } from '@/features/admin/dashboard/server/webEvents';

export const prerender = false;

/**
 * Métrica de la landing (sin sesión): { e: "visita" | "whatsapp" | "chat" }. Solo desde la propia web. Responde 204
 * siempre que el evento sea válido, aunque la base falle: medir nunca debe molestar a quien visita.
 */
export const POST: APIRoute = async ({ request, url }) => {
  if (request.headers.get('origin') !== url.origin) return new Response(null, { status: 403 });
  let event: unknown;
  try {
    event = ((await request.json()) as { e?: unknown }).e;
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!isWebEvent(event)) return new Response(null, { status: 400 });
  await countWebEvent(event).catch((e) => console.error('[métricas] no se pudo contar:', e));
  return new Response(null, { status: 204 });
};
