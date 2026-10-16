import { useEffect, useState } from 'react';

/** Lo que dura la animación de salida antes de quitar el aviso. */
const EXIT_MS = 300;
const TICK_MS = 50;

/** Barra de progreso y cierre (automático al agotarse `duration`, o manual) de un aviso. */
export function useToastCard(duration: number, onDismiss: () => void) {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  function leave() {
    setExiting(true);
    setTimeout(onDismiss, EXIT_MS);
  }

  useEffect(() => {
    if (duration <= 0) return;
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct === 0) {
        clearInterval(tick);
        leave();
      }
    }, TICK_MS);
    return () => clearInterval(tick);
  }, []);

  return { exiting, progress, hasProgress: duration > 0, leave };
}
