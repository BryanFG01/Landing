// Datos de la página de login (src/pages/admin/login.astro): el documento se viste con la plantilla publicada en la
// web (colores y tipografías) y la vista toma de Apariencia el nombre, el logo, la foto y los textos.

import { isLightTheme, loginThemeCss, type Appearance } from '@/features/admin/core/domain/schema';
import type { FontKey, SiteContent } from '@/features/landing/domain/sitio';
import type { LoginViewProps } from '../LoginView.types';

export interface LoginPage {
  theme: 'light' | 'dark';
  extraCss: string;
  fonts: { titulos: FontKey; cuerpo: FontKey; peso: string };
  view: LoginViewProps;
}

/** `fotoSrc` es la foto de siempre (la báscula), para cuando Apariencia no tiene una propia. */
export function loginPage(appearance: Appearance, site: SiteContent, fotoSrc: string): LoginPage {
  const { tema, marca } = site;
  return {
    theme: isLightTheme(tema) ? 'light' : 'dark',
    extraCss: loginThemeCss(tema),
    fonts: { titulos: tema.titulos, cuerpo: tema.cuerpo, peso: tema.pesoTitulos },
    view: {
      image: appearance.login_image || fotoSrc,
      brand: appearance.name,
      tagline: marca.lema,
      logo: appearance.logo || '/icon-192.png',
      title: appearance.login_title,
      text: appearance.login_text,
    },
  };
}
