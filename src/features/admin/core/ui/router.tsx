// Provider del enrutador del panel. La lógica está en hooks/useRouterState.ts y el contexto en router.context.ts.
import * as React from 'react';
import { useRouterState } from './hooks/useRouterState';
import { RouterContext } from './router.context';
import type { RouterProviderProps } from './router.types';

// Muchas pantallas importan useRouter desde aquí: se reexporta para no romperlas.
export { useRouter } from './router.context';

export function RouterProvider({ children }: Readonly<RouterProviderProps>) {
  return <RouterContext.Provider value={useRouterState()}>{children}</RouterContext.Provider>;
}
