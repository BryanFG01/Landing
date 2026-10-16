import { useContext } from 'react';
import { ToastContext } from './toast.context';
import type { ToastContextValue } from './types';

/** Acceso a `toast()` y `dismiss()` desde cualquier componente bajo <ToastProvider>. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
