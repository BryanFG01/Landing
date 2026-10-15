// Carga el módulo de la URL y comprueba el permiso del usuario. Devuelve el módulo o la respuesta de error.

import type { AdminUser, ModuleAccess } from '../schema';
import { fail } from './http';
import { getModuleByKey, moduleAccess, type LoadedModule } from './modules';
import { canWrite, SourceError } from './sources';

export async function moduleFor(
  key: string | undefined,
  user: AdminUser,
  need: 'view' | 'edit',
): Promise<{ mod: LoadedModule; access: ModuleAccess } | Response> {
  const mod = await getModuleByKey(key ?? '');
  if (!mod) return fail(404, 'Este módulo no existe o está desactivado.');
  const access = await moduleAccess(user, mod.id);
  // Sin acceso se responde como si no existiera.
  if (access === 'none') return fail(404, 'Este módulo no existe o está desactivado.');
  if (need === 'edit') {
    if (access !== 'edit') return fail(403, 'Solo tienes permiso para ver este módulo.');
    if (!canWrite(mod)) return fail(405, 'Este módulo es de solo lectura (consulta SQL).');
  }
  return { mod, access };
}

/** Errores de origen (tabla borrada, consulta rota, dato duplicado…) como respuesta JSON. */
export function sourceFailure(e: unknown) {
  if (e instanceof SourceError) return fail(e.status, e.message);
  throw e;
}
