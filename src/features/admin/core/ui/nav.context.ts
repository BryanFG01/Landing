// Contextos del shell (menú y apariencia). Van aparte de los Provider para que los .tsx solo pinten.
import * as React from 'react';
import type { AppearanceState, NavState } from './hooks/useShellState';

export const NavContext = React.createContext<NavState | null>(null);
export const AppearanceContext = React.createContext<AppearanceState | null>(null);

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
