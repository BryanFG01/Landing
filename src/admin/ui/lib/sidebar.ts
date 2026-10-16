// Menú lateral del panel: sale de la base de datos (un apartado por grupo con los módulos que el usuario puede ver)
// más las entradas fijas de configuración para administradores.
import type { NavModule } from '../../schema';
import type { Nav } from '../hooks/useShellState';

export interface MenuItem {
  label: string;
  href: string;
  icon: string | null;
  /** Pendientes del módulo (pedidos por atender). */
  badge?: number;
}

export interface MenuSection {
  section: string;
  items: MenuItem[];
}

/** Entradas de Configuración, solo para administradores. */
export const SETTINGS_LINKS: MenuItem[] = [
  { label: 'Sitio web', href: '/admin/sitio', icon: 'storefront' },
  { label: 'Constructor de módulos', href: '/admin/modulos', icon: 'wrench' },
  { label: 'Consola SQL', href: '/admin/sql', icon: 'terminal' },
  { label: 'Usuarios y permisos', href: '/admin/usuarios', icon: 'user-gear' },
  { label: 'Apariencia', href: '/admin/apariencia', icon: 'palette' },
];

const moduleItem = (m: NavModule): MenuItem => ({
  label: m.name,
  href: `/admin/m/${m.module_key}`,
  icon: m.icon,
  ...(m.pending > 0 ? { badge: m.pending } : {}),
});

/** Total de pendientes del menú (para el aviso de pedidos nuevos y el título de la pestaña). */
export const totalPending = (modules: NavModule[]) => modules.reduce((sum, m) => sum + m.pending, 0);

/** Texto del aviso cuando llegan pendientes nuevos. */
export const newPendingMessage = (added: number) =>
  added === 1 ? 'Llegó un pedido nuevo.' : `Llegaron ${added} pedidos nuevos.`;

export function buildMenu(nav: Nav, isAdmin: boolean): MenuSection[] {
  const sections: MenuSection[] = [{ section: '', items: [{ label: 'Inicio', href: '/admin', icon: 'house' }] }];
  for (const g of nav.groups) {
    const items = nav.modules.filter((m) => m.group_id === g.id).map(moduleItem);
    if (items.length) sections.push({ section: g.name, items });
  }
  const loose = nav.modules.filter((m) => !m.group_id || !nav.groups.some((g) => g.id === m.group_id)).map(moduleItem);
  if (loose.length) sections.push({ section: 'Módulos', items: loose });
  if (isAdmin) sections.push({ section: 'Configuración', items: SETTINGS_LINKS });
  return sections;
}

/** Enlace activo: el más largo que sea prefijo de la ruta (el editor de un módulo cuelga del constructor). */
export function activeHrefFor(sections: MenuSection[], path: string) {
  const matches = sections
    .flatMap((s) => s.items.map((i) => i.href))
    .filter((href) => path === href || (href !== '/admin' && path.startsWith(`${href}/`)));
  return matches.reduce((best, href) => (href.length > best.length ? href : best), '') || path;
}
