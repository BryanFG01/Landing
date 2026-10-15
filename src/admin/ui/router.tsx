// Contexto del enrutador del panel. La lógica está en hooks/useRouterState.ts.
import * as React from 'react';
import { useRouterState, type Router } from './hooks/useRouterState';

const RouterContext = React.createContext<Router | null>(null);

export function RouterProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RouterContext.Provider value={useRouterState()}>{children}</RouterContext.Provider>;
}

export const useRouter = () => {
  const ctx = React.useContext(RouterContext);
  if (!ctx) throw new Error('useRouter debe usarse dentro de <RouterProvider>');
  return ctx;
};
