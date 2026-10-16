// Métricas de la landing para el panel: una visita por sesión del navegador, cada clic en un enlace de WhatsApp y cada
// vez que se abre el chat (lo avisa src/scripts/chat.ts). Sin cookies ni datos personales. No cuenta la vista previa
// del panel.

type WebEvent = 'visita' | 'whatsapp' | 'chat';

/**
 * Envía el evento sin frenar nada (sendBeacon sobrevive a salir de la página, como al abrir WhatsApp). Va como texto
 * plano: con tipo JSON, algunos navegadores no envían el beacon. El servidor lo lee igual como JSON.
 */
export function track(e: WebEvent) {
  if (location.pathname.startsWith('/admin')) return;
  const body = JSON.stringify({ e });
  const sent = navigator.sendBeacon?.('/api/evento', new Blob([body], { type: 'text/plain' }));
  if (!sent) fetch('/api/evento', { method: 'POST', body, keepalive: true }).catch(() => {});
}

function countVisitOncePerSession() {
  try {
    if (sessionStorage.getItem('visita-contada')) return;
    sessionStorage.setItem('visita-contada', '1');
  } catch {
    // Sin almacenamiento (modo privado estricto): se cuenta igual.
  }
  track('visita');
}

countVisitOncePerSession();
document.addEventListener('click', (event) => {
  const link = (event.target as Element | null)?.closest?.('a[href^="https://wa.me/"]');
  if (link) track('whatsapp');
});
