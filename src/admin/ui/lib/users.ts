// Usuarios del panel: tipos del formulario y reglas de permisos por módulo (puras, sin React).
import type { AdminUser, ModuleAccess, Role } from '../../schema';
import type { Mod } from './modules';

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

/** Las consultas son de solo lectura: no se pueden editar. */
export const accessOptionsFor = (m: Mod) => (m.source_type === 'query' ? ACCESS_OPTIONS.slice(0, 2) : ACCESS_OPTIONS);

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
