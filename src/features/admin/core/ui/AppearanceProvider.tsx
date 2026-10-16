// Provider de la apariencia del panel. La lógica está en hooks/useShellState.ts y el contexto en nav.context.ts.
import * as React from 'react';
import { useAppearanceState } from './hooks/useShellState';
import { AppearanceContext } from './nav.context';
import type { AppearanceProviderProps } from './nav.types';

export function AppearanceProvider({ initial, siteTheme, children }: Readonly<AppearanceProviderProps>) {
  return <AppearanceContext.Provider value={useAppearanceState(initial, siteTheme)}>{children}</AppearanceContext.Provider>;
}
