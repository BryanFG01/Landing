// Contenido de la vista previa del borrador (/admin/vista-previa).

import { aplicarCatalogo, usaCatalogo } from '@/features/landing/domain/catalogo';
import type { SiteContent } from '@/features/landing/domain/sitio';
import { loadCatalog } from './catalog';
import { getDraft } from './site';

/** El borrador tal como se verá: con el catálogo único, los productos salen del módulo del panel, igual que en la web. */
export async function loadPreviewDraft(): Promise<SiteContent> {
  const borrador = await getDraft();
  if (!usaCatalogo(borrador)) return borrador;
  return aplicarCatalogo(borrador, await loadCatalog());
}
