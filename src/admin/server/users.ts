// Datos de usuario que llegan del formulario de Usuarios: rol y permisos por módulo.

import { ROLES, type Role } from '../schema';
import type { ScopedQuery } from './db';

export interface Permission {
  module_id: number;
  can_edit: boolean;
}

export function parseRole(v: unknown): Role {
  return typeof v === 'string' && v in ROLES ? (v as Role) : 'usuario';
}

export function parsePermissions(v: unknown): Permission[] {
  const seen = new Set<number>();
  const out: Permission[] = [];
  for (const p of Array.isArray(v) ? v : []) {
    const id = Number((p as Permission)?.module_id);
    if (!Number.isInteger(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    out.push({ module_id: id, can_edit: (p as Permission).can_edit === true });
  }
  return out;
}

/** Reemplaza los permisos de un usuario (los administradores no los necesitan: se borran). */
export async function savePermissions(q: ScopedQuery, userId: number, role: Role, permissions: Permission[]) {
  await q('DELETE FROM admin.user_modules WHERE user_id = ?', [userId]);
  if (role === 'admin') return;
  for (const p of permissions) {
    await q(
      `INSERT INTO admin.user_modules (user_id, module_id, can_edit)
       SELECT ?, id, ? FROM admin.modules WHERE id = ?`,
      [userId, p.can_edit, p.module_id],
    );
  }
}
