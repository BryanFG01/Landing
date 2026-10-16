import type { Appearance, PanelSiteTheme } from '@/features/admin/core/domain/schema';
import type { FontKey } from '@/features/landing/domain/sitio';

export interface Props {
  title: string;
  /** 'auto': el tema guardado, el de Apariencia o el del sistema. 'dark' / 'light': fijo (el login, según la web). */
  theme?: 'auto' | 'dark' | 'light';
  appearance?: Appearance;
  /** Plantilla publicada de la web: el panel toma de ella colores, esquinas y tipografías (si Apariencia lo indica). */
  site?: PanelSiteTheme | null;
  /** CSS extra después de Apariencia (el login con los colores de la web). */
  extraCss?: string;
  /** Tipografías de la web para títulos y textos (el login). Sin ellas, las de la plantilla o las de siempre. */
  fonts?: { titulos: FontKey; cuerpo: FontKey; peso: string };
}
