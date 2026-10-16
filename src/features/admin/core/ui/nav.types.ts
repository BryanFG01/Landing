// Tipos de nav.tsx.
import type * as React from 'react';
import type { Appearance, PanelSiteTheme } from '../domain/schema';
import type { Nav } from './hooks/useShellState';

export interface NavProviderProps {
  initial: Nav;
  children: React.ReactNode;
}

export interface AppearanceProviderProps {
  initial: Appearance;
  siteTheme: PanelSiteTheme | null;
  children: React.ReactNode;
}
