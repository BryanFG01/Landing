// Usuarios del panel: tipos del formulario y reglas de permisos por módulo (puras, sin React).
import { ROLES, type AdminUser, type ModuleAccess, type Role } from '@/features/admin/core/domain/schema';
import type { Mod } from '@/features/admin/core/ui/lib/modules';

export type Permission = { module_id: number; can_edit: boolean };

// Record<string, unknown>: la tabla de nuvo-ui pide filas indexables.
export type UserRow = AdminUser &
  Record<string, unknown> & {
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
    permissions: Permission[];
  };

export type UserForm = {
  name: string;
  email: string;
  password: string;
  is_active: boolean;
  role: Role;
  permissions: Permission[];
};

export const EMPTY_USER: UserForm = { name: '', email: '', password: '', is_active: true, role: 'usuario', permissions: [] };

export const formFor = (u: UserRow | 'new'): UserForm =>
  u === 'new'
    ? EMPTY_USER
    : { name: u.name, email: u.email, password: '', is_active: u.is_active, role: u.role, permissions: u.permissions };

export const ACCESS_OPTIONS: { value: ModuleAccess; label: string }[] = [
  { value: 'none', label: 'Sin acceso' },
  { value: 'view', label: 'Ver y exportar' },
  { value: 'edit', label: 'Ver y editar' },
];

/** Módulo de consulta (SELECT guardado): de solo lectura. */
export const isQueryModule = (m: Pick<Mod, 'source_type'>) => m.source_type === 'query';

/** Las consultas son de solo lectura: no se pueden editar. */
export const accessOptionsFor = (m: Mod) => (isQueryModule(m) ? ACCESS_OPTIONS.slice(0, 2) : ACCESS_OPTIONS);

export const ROLE_OPTIONS = Object.entries(ROLES).map(([value, label]) => ({ value, label }));

/** Rol con permisos por módulo (el administrador lo ve y edita todo). */
export const hasModulePermissions = (role: Role) => role === 'usuario';

/** Nombres de los módulos con permiso, para el título de la celda de acceso. */
export const permissionNames = (permissions: Permission[], moduleNames: Map<number, string>) =>
  permissions.map((p) => moduleNames.get(p.module_id)).join(', ');

export function accessLevel(permissions: Permission[], moduleId: number): ModuleAccess {
  const p = permissions.find((x) => x.module_id === moduleId);
  if (!p) return 'none';
  return p.can_edit ? 'edit' : 'view';
}

export function withAccess(permissions: Permission[], moduleId: number, level: string): Permission[] {
  const rest = permissions.filter((x) => x.module_id !== moduleId);
  return level === 'none' ? rest : [...rest, { module_id: moduleId, can_edit: level === 'edit' }];
}

export const viewAll = (modules: Mod[]): Permission[] => modules.map((m) => ({ module_id: m.id, can_edit: false }));

/** "3 módulo(s), 1 con edición" para la tabla de usuarios. */
export function accessSummary(permissions: Permission[]) {
  if (!permissions.length) return 'Sin módulos';
  return `${permissions.length} módulo(s), ${permissions.filter((p) => p.can_edit).length} con edición`;
}
