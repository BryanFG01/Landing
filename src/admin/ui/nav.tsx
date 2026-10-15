// Estado del sidebar (grupos y módulos). Las vistas que cambian la configuración llaman a refreshNav()
// para que el menú se actualice al momento, sin recargar la página.
import * as React from 'react';
import type { ModuleGroup, NavModule } from '../schema';
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
