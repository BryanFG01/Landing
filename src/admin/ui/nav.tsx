// Estado compartido del shell: el sidebar (grupos y módulos) y la apariencia. Las vistas que cambian la configuración
// llaman a refreshNav() o setAppearance() para que el menú y los colores se actualicen al momento, sin recargar.
import * as React from 'react';
import { appearanceCss, type Appearance, type ModuleGroup, type NavModule } from '../schema';
import { api } from './api';

export interface Nav {
  groups: ModuleGroup[];
  modules: NavModule[];
}

const NavContext = React.createContext<{ nav: Nav; refreshNav: () => Promise<void> } | null>(null);

export function NavProvider({ initial, children }: { initial: Nav; children: React.ReactNode }) {
  const [nav, setNav] = React.useState(initial);
  const refreshNav = React.useCallback(async () => {
    setNav(await api<Nav>('/nav'));
  }, []);
  const value = React.useMemo(() => ({ nav, refreshNav }), [nav, refreshNav]);
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export const useNav = () => {
  const ctx = React.useContext(NavContext);
  if (!ctx) throw new Error('useNav debe usarse dentro de <NavProvider>');
  return ctx;
};

// ─── Apariencia ──────────────────────────────────────────────────────────────

const AppearanceContext = React.createContext<{
  appearance: Appearance;
  /** Aplica una apariencia (vista previa o guardada) sin recargar la página. */
  setAppearance: (a: Appearance) => void;
} | null>(null);

export function AppearanceProvider({ initial, children }: { initial: Appearance; children: React.ReactNode }) {
  const [appearance, setState] = React.useState(initial);
  const setAppearance = React.useCallback((a: Appearance) => {
    setState(a);
    // Las variables de color también las usa el CSS fuera de React: se sustituye el <style> del layout.
    let style = document.getElementById('admin-appearance') as HTMLStyleElement | null;
    if (!style) {
      style = Object.assign(document.createElement('style'), { id: 'admin-appearance' });
      document.head.append(style);
    }
    style.textContent = appearanceCss(a);
  }, []);
  const value = React.useMemo(() => ({ appearance, setAppearance }), [appearance, setAppearance]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export const useAppearance = () => {
  const ctx = React.useContext(AppearanceContext);
  if (!ctx) throw new Error('useAppearance debe usarse dentro de <AppearanceProvider>');
  return ctx;
};
