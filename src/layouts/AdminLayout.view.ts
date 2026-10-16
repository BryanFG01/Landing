import {
  DEFAULT_APPEARANCE,
  followsSite,
  panelCss,
  type Appearance,
  type PanelSiteTheme,
} from '@/features/admin/core/domain/schema';
import { FONTS, type FontKey } from '@/features/landing/domain/sitio';
import type { Props } from './AdminLayout.types';

// Tipografías de siempre del panel cuando ni el login ni la plantilla eligen otras.
const DEFAULT_FONT_VARS = ['--font-hina', '--font-zen'];

// Tema antes de pintar: el que eligió la persona, el de Apariencia o el del sistema. Va en línea (no como módulo) para
// que se ejecute antes del primer pintado. El texto y su sangría son los de la etiqueta <script define:vars> que había
// en AdminLayout.astro, para que el HTML no cambie.
const THEME_SCRIPT_BODY = `
          // Tema antes de pintar: el que eligió la persona, el de Apariencia o el del sistema.
          try {
            const saved = localStorage.getItem('admin-theme');
            const choice = saved || (preferred === 'auto' ? null : preferred);
            const dark = choice ? choice === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.classList.toggle('dark', dark);
          } catch {}
        `;

const isFont = (k: string): k is FontKey => k in FONTS;
const stack = (k: FontKey) => `var(${FONTS[k].css}), ${FONTS[k].fallback}`;

/** Igual que `define:vars` de Astro: el valor en JSON, sin "<" para que no pueda cerrar la etiqueta. */
const scriptValue = (value: unknown) => JSON.stringify(value)?.replaceAll('<', '\\u003c');

const themeScript = (preferred: Appearance['theme']) =>
  `(function(){const preferred = ${scriptValue(preferred)};\n${THEME_SCRIPT_BODY}})();`;

/** Tipografías del panel: las que pide la página (el login) o, si Apariencia sigue a la web, las de la plantilla. */
function fontsOf(props: Props, appearance: Appearance, site: PanelSiteTheme | null) {
  const siteFonts =
    followsSite(appearance, site) && isFont(site.titulos) && isFont(site.cuerpo)
      ? { titulos: site.titulos, cuerpo: site.cuerpo, peso: site.pesoTitulos }
      : undefined;
  return props.fonts ?? siteFonts;
}

/** Documento del panel: clase del tema, CSS de Apariencia y tipografías, favicon y el script del tema. */
export function adminLayoutView(props: Props) {
  const { theme = 'auto', appearance = DEFAULT_APPEARANCE, site = null, extraCss = '' } = props;
  const fonts = fontsOf(props, appearance, site);
  // El grosor de títulos de la plantilla: en el login, sus títulos grandes; en el panel, solo el título de cada página
  // (los subtítulos pequeños se quedan con el suyo para que se lean).
  const weightSelector = props.fonts ? 'h1,h2' : 'h1';
  const fontCss = fonts
    ? `html:root{--font-display:${stack(fonts.titulos)};--font-sans:${stack(fonts.cuerpo)}}${weightSelector}{font-weight:${fonts.peso}}`
    : '';
  return {
    appearance,
    htmlClass: theme === 'dark' ? 'dark' : undefined,
    isAutoTheme: theme === 'auto',
    fontVars: fonts ? [...new Set([FONTS[fonts.titulos].css, FONTS[fonts.cuerpo].css])] : DEFAULT_FONT_VARS,
    css: panelCss(appearance, site) + extraCss + fontCss,
    favicon: appearance.logo || '/icon-192.png',
    themeScript: themeScript(appearance.theme),
  };
}
