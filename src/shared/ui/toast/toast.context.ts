import { createContext } from 'react';
import type { ToastContextValue } from './types';

/** Acciones de los avisos; solo existe dentro de <ToastProvider>. */
export const ToastContext = createContext<ToastContextValue | null>(null);
