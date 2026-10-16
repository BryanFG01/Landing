import { useEffect, useState } from 'react';
import type { ToastItem } from './types';

/** Lista de avisos abiertos y las acciones para abrir y cerrar uno. */
export function useToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // El portal necesita `document`: solo se pinta después de montar en el navegador.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function toast(item: Omit<ToastItem, 'id'>): string {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...item, id }]);
    return id;
  }

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return { toasts, mounted, toast, dismiss };
}
