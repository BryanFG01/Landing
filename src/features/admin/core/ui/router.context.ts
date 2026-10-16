// Contexto del enrutador del panel. Va aparte del Provider para que el .tsx solo pinte.
import * as React from 'react';
import type { Router } from './hooks/useRouterState';

export const RouterContext = React.createContext<Router | null>(null);

export const useRouter = () => {
  const ctx = React.useContext(RouterContext);
  if (!ctx) throw new Error('useRouter debe usarse dentro de <RouterProvider>');
  return ctx;
};
