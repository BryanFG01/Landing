// Provider del menú del shell. La lógica está en hooks/useShellState.ts y los contextos en nav.context.ts.
import * as React from 'react';
import { useNavState } from './hooks/useShellState';
import { NavContext } from './nav.context';
import type { NavProviderProps } from './nav.types';

// Muchas pantallas importan estos nombres desde aquí: se reexportan para no romperlas.
export type { Nav } from './hooks/useShellState';
export { useAppearance, useNav } from './nav.context';
export { AppearanceProvider } from './AppearanceProvider';

export function NavProvider({ initial, children }: Readonly<NavProviderProps>) {
  return <NavContext.Provider value={useNavState(initial)}>{children}</NavContext.Provider>;
}
