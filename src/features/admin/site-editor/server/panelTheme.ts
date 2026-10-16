// Colores y tipografías de la plantilla publicada que el panel toma para su primer pintado (src/pages/admin/[...path]).

import type { PanelSiteTheme } from '@/features/admin/core/domain/schema';
import { getSite } from '@/features/landing/server/contenido';
import { panelThemeOf } from '../ui/lib/siteEditor';

/** La plantilla publicada, o null si no se puede leer (base caída a medias): el panel usa entonces Apariencia. */
export async function getPublishedPanelTheme(): Promise<PanelSiteTheme | null> {
  try {
    return panelThemeOf((await getSite()).tema);
  } catch {
    return null;
  }
}
