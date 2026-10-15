// Contextos del shell (menú y apariencia). La lógica está en hooks/useShellState.ts.
import * as React from 'react';
import type { Appearance } from '../schema';
import { useAppearanceState, useNavState, type AppearanceState, type Nav, type NavState } from './hooks/useShellState';

export type { Nav } from './hooks/useShellState';

const NavContext = React.createContext<NavState | null>(null);
const AppearanceContext = React.createContext<AppearanceState | null>(null);

export function NavProvider({ initial, children }: Readonly<{ initial: Nav; children: React.ReactNode }>) {
  return <NavContext.Provider value={useNavState(initial)}>{children}</NavContext.Provider>;
}

export function AppearanceProvider({ initial, children }: Readonly<{ initial: Appearance; children: React.ReactNode }>) {
  return <AppearanceContext.Provider value={useAppearanceState(initial)}>{children}</AppearanceContext.Provider>;
}

export const useNav = () => {
  const ctx = React.useContext(NavContext);
  if (!ctx) throw new Error('useNav debe usarse dentro de <NavProvider>');
  return ctx;
};

export const useAppearance = () => {
  const ctx = React.useContext(AppearanceContext);
  if (!ctx) throw new Error('useAppearance debe usarse dentro de <AppearanceProvider>');
  return ctx;
};
