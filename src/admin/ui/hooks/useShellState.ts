// Estado compartido del shell: el sidebar (grupos y módulos) y la apariencia. Las vistas que cambian la configuración
// llaman a refreshNav() o setAppearance() para que el menú y los colores se actualicen al momento, sin recargar.
import * as React from 'react';
import { appearanceCss, type Appearance, type ModuleGroup, type NavModule } from '../../schema';
import { api } from '../api';

export interface Nav {
  groups: ModuleGroup[];
  modules: NavModule[];
}

export interface NavState {
  nav: Nav;
  refreshNav: () => Promise<void>;
}

export function useNavState(initial: Nav): NavState {
  const [nav, setNav] = React.useState(initial);
  const refreshNav = React.useCallback(async () => {
    setNav(await api<Nav>('/nav'));
  }, []);
  return React.useMemo(() => ({ nav, refreshNav }), [nav, refreshNav]);
}

export interface AppearanceState {
  appearance: Appearance;
  /** Aplica una apariencia (vista previa o guardada) sin recargar la página. */
  setAppearance: (a: Appearance) => void;
}

/** Las variables de color también las usa el CSS fuera de React: se sustituye el <style> del layout. */
function applyAppearanceCss(a: Appearance) {
  let style = document.getElementById('admin-appearance') as HTMLStyleElement | null;
  if (!style) {
    style = Object.assign(document.createElement('style'), { id: 'admin-appearance' });
    document.head.append(style);
  }
  style.textContent = appearanceCss(a);
}

export function useAppearanceState(initial: Appearance): AppearanceState {
  const [appearance, setState] = React.useState(initial);
  const setAppearance = React.useCallback((a: Appearance) => {
    setState(a);
    applyAppearanceCss(a);
  }, []);
  return React.useMemo(() => ({ appearance, setAppearance }), [appearance, setAppearance]);
}

/** Tema claro/oscuro del panel, recordado en el navegador. */
export function useTheme() {
  const [dark, setDark] = React.useState(() => document.documentElement.classList.contains('dark'));
  const toggle = React.useCallback(() => {
    setDark((current) => {
      const next = !current;
      document.documentElement.classList.toggle('dark', next);
      try {
        localStorage.setItem('admin-theme', next ? 'dark' : 'light');
      } catch {
        // Sin almacenamiento (modo privado): el tema dura hasta recargar.
      }
      return next;
    });
  }, []);
  return { dark, toggle };
}
