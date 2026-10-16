// Catálogo único (servidor): lee los productos del módulo del panel para la landing y el chat, y reacciona cuando se
// guardan (fotos públicas y nuevo despliegue de la web). Las reglas puras están en src/data/catalogo.ts.

import { CATALOG_MODULE, productoDeRegistro, usaCatalogo } from '../../data/catalogo';
import type { ProductoWeb } from '../../data/sitio';
import type { FileRef } from '../schema';
import { exec } from './db';
import { getModuleByKey, type LoadedModule } from './modules';
import { getPublished, triggerDeploy } from './site';
import { allRows } from './sources';

const MAX_PRODUCTS = 100;

/** Productos del módulo del catálogo, en el orden en que se crearon. Null si el módulo no existe o no responde. */
export async function loadCatalog(): Promise<ProductoWeb[] | null> {
  try {
    const mod = await getModuleByKey(CATALOG_MODULE);
    if (!mod || mod.source_type === 'query') return null;
    const rows = await allRows(mod, { dir: 'asc', filters: {} }, MAX_PRODUCTS);
    // En orden de creación (por id): el orden del módulo depende de sus columnas ordenables, que pueden cambiar.
    const byId = (a: { __id: string | number }, b: { __id: string | number }) =>
      typeof a.__id === 'number' && typeof b.__id === 'number' ? a.__id - b.__id : String(a.__id).localeCompare(String(b.__id));
    return [...rows]
      .sort(byId)
      .map((r) => productoDeRegistro(r.__id, r))
      .filter((p): p is ProductoWeb => p !== null);
  } catch (e) {
    console.error('[catálogo] no se pudo leer:', e);
    return null;
  }
}

const isFileRef = (v: unknown): v is FileRef => !!v && typeof v === 'object' && typeof (v as FileRef).id === 'string';

/**
 * Tras guardar o borrar un producto del catálogo: sus fotos pasan a ser públicas (se ven en la web sin sesión) y, si la
 * web publicada usa el catálogo, se pide a Vercel que la vuelva a construir. Para otros módulos no hace nada.
 */
export async function onCatalogChange(mod: LoadedModule, data?: Record<string, unknown>) {
  if (mod.module_key !== CATALOG_MODULE) return null;
  const fileIds = mod.fields
    .filter((f) => f.type === 'image')
    .map((f) => data?.[f.key])
    .filter(isFileRef)
    .map((f) => f.id);
  if (fileIds.length) await exec('UPDATE admin.files SET public = true WHERE id = ANY(?::uuid[])', [fileIds]);

  const published = await getPublished();
  if (!published || !usaCatalogo(published)) return null;
  return triggerDeploy();
}
