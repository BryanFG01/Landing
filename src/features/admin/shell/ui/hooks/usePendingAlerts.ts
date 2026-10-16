// Pedidos nuevos sin recargar: refresca el menú cada 30 s (con la pestaña visible), avisa cuando sube el número de
// pendientes y lo muestra en el título de la pestaña ("(2) Panel · El Agropecuario").
import * as React from 'react';
import { useToast } from '@/shared/ui/toast';
import { newPendingMessage, totalPending } from '../lib/sidebar';
import { useNav } from '@/features/admin/core/ui/nav';

const EVERY_MS = 30_000;

export function usePendingAlerts() {
  const { nav, refreshNav } = useNav();
  const { toast } = useToast();
  const total = totalPending(nav.modules);
  const previous = React.useRef(total);
  const baseTitle = React.useRef(document.title.replace(/^\(\d+\)\s*/, ''));

  // Refresco periódico, solo con la pestaña a la vista; al volver a ella, uno inmediato.
  React.useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') refreshNav().catch(() => {});
    };
    const timer = setInterval(tick, EVERY_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [refreshNav]);

  React.useEffect(() => {
    const added = total - previous.current;
    previous.current = total;
    if (added > 0) toast({ variant: 'default', title: newPendingMessage(added) });
    document.title = total > 0 ? `(${total}) ${baseTitle.current}` : baseTitle.current;
  }, [total, toast]);
}
