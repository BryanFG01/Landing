// Estado compartido del shell: el sidebar (grupos y módulos) y la apariencia. Las vistas que cambian la configuración
// llaman a refreshNav() o setAppearance() para que el menú y los colores se actualicen al momento, sin recargar.
import * as React from 'react';
import { panelCss, type Appearance, type ModuleGroup, type NavModule, type PanelSiteTheme } from '../../domain/schema';
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
  /** La que se ve ahora en el panel (puede ser la vista previa de Apariencia). */
  appearance: Appearance;
  /** La guardada (para saber si la vista previa tiene cambios). */
  savedAppearance: Appearance;
  /** Plantilla publicada de la web (el panel toma de ella los colores si Apariencia lo indica). */
  siteTheme: PanelSiteTheme | null;
  /** Aplica una apariencia recién guardada sin recargar la página. */
  setAppearance: (a: Appearance) => void;
  /** Muestra una apariencia en todo el panel sin darla por guardada (vista previa de Apariencia). */
  previewAppearance: (a: Appearance) => void;
  /** Tras publicar la web con otra plantilla: el panel cambia de colores al momento. */
  setSiteTheme: (t: PanelSiteTheme) => void;
}

/**
 * Las variables de color también las usa el CSS fuera de React: se sustituye el <style> del layout. Las tipografías
 * de una plantilla nueva se cargan al recargar la página (las elige el layout en el servidor).
 */
function applyPanelCss(a: Appearance, site: PanelSiteTheme | null) {
  let style = document.getElementById('admin-appearance') as HTMLStyleElement | null;
  if (!style) {
    style = Object.assign(document.createElement('style'), { id: 'admin-appearance' });
    document.head.append(style);
  }
  style.textContent = panelCss(a, site);
}

export function useAppearanceState(initial: Appearance, initialSite: PanelSiteTheme | null): AppearanceState {
  const [appearance, setShown] = React.useState(initial);
  const [savedAppearance, setSaved] = React.useState(initial);
  const [siteTheme, setSite] = React.useState(initialSite);
  // Refs para que cada setter aplique el CSS con el valor más reciente del otro.
  const latest = React.useRef({ appearance: initial, siteTheme: initialSite });
  const previewAppearance = React.useCallback((a: Appearance) => {
    latest.current.appearance = a;
    setShown(a);
    applyPanelCss(a, latest.current.siteTheme);
  }, []);
  const setAppearance = React.useCallback(
    (a: Appearance) => {
      setSaved(a);
      previewAppearance(a);
    },
    [previewAppearance],
  );
  const setSiteTheme = React.useCallback((t: PanelSiteTheme) => {
    latest.current.siteTheme = t;
    setSite(t);
    applyPanelCss(latest.current.appearance, t);
  }, []);
  return React.useMemo(
    () => ({ appearance, savedAppearance, siteTheme, setAppearance, previewAppearance, setSiteTheme }),
    [appearance, savedAppearance, siteTheme, setAppearance, previewAppearance, setSiteTheme],
  );
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
