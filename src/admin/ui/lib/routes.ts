// Rutas del panel: qué pantalla corresponde a cada URL, su título y sus migas de pan.
import type { BreadcrumbItem } from '../../../components/ui/breadcrumb';
import type { AdminUser } from '../../schema';
import type { Nav } from '../hooks/useShellState';

export type Route =
  | { name: 'dashboard' }
  | { name: 'module'; key: string }
  | { name: 'modules' }
  | { name: 'editor'; id: number | null }
  | { name: 'users' }
  | { name: 'sql' }
  | { name: 'appearance' }
  | { name: 'site' }
  | { name: 'not-found' };

/** Rutas de configuración: solo administradores. */
const ADMIN_ROUTES = new Set<Route['name']>(['modules', 'editor', 'users', 'sql', 'appearance', 'site']);

const STATIC_ROUTES: Record<string, Route> = {
  '/admin': { name: 'dashboard' },
  '/admin/modulos': { name: 'modules' },
  '/admin/usuarios': { name: 'users' },
  '/admin/sql': { name: 'sql' },
  '/admin/apariencia': { name: 'appearance' },
  '/admin/sitio': { name: 'site' },
};

const STATIC_TITLES: Partial<Record<Route['name'], string>> = {
  dashboard: 'Inicio',
  modules: 'Constructor de módulos',
  users: 'Usuarios y permisos',
  sql: 'Consola SQL',
  appearance: 'Apariencia',
  site: 'Sitio web',
  'not-found': 'No encontrado',
};

const MODULE_RE = /^\/admin\/m\/([a-z][a-z0-9_]{1,47})$/;
const EDITOR_RE = /^\/admin\/modulos\/(nuevo|\d+)$/;

export function matchRoute(path: string): Route {
  const p = path.split('?')[0].replace(/\/+$/, '') || '/admin';
  if (STATIC_ROUTES[p]) return STATIC_ROUTES[p];
  const mod = MODULE_RE.exec(p);
  if (mod) return { name: 'module', key: mod[1] };
  const editor = EDITOR_RE.exec(p);
  if (editor) return { name: 'editor', id: editor[1] === 'nuevo' ? null : Number(editor[1]) };
  return { name: 'not-found' };
}

export interface RouteMeta {
  title: string;
  breadcrumb: BreadcrumbItem[];
  /** false: la persona no tiene permiso para esta pantalla. */
  allowed: boolean;
}

const HOME: BreadcrumbItem = { label: 'Inicio', href: '/admin' };
const BUILDER: BreadcrumbItem = { label: 'Constructor', href: '/admin/modulos' };

/** Título y migas de una ruta. Los nombres de módulo salen del menú ya cargado. */
export function routeMeta(route: Route, nav: Nav, user: AdminUser): RouteMeta {
  if (ADMIN_ROUTES.has(route.name) && user.role !== 'admin') {
    return { title: 'Sin acceso', breadcrumb: [HOME, { label: 'Sin acceso' }], allowed: false };
  }
  switch (route.name) {
    case 'dashboard':
      return { title: 'Inicio', breadcrumb: [HOME], allowed: true };
    case 'module': {
      const title = nav.modules.find((m) => m.module_key === route.key)?.name ?? 'Módulo';
      return { title, breadcrumb: [HOME, { label: title }], allowed: true };
    }
    case 'modules':
      return { title: STATIC_TITLES.modules!, breadcrumb: [HOME, BUILDER], allowed: true };
    case 'editor': {
      if (!route.id) return { title: 'Nuevo módulo', breadcrumb: [HOME, BUILDER, { label: 'Nuevo módulo' }], allowed: true };
      const name = nav.modules.find((m) => m.id === route.id)?.name;
      return { title: `Configurar ${name ?? 'módulo'}`, breadcrumb: [HOME, BUILDER, { label: name ?? 'Configurar' }], allowed: true };
    }
    default: {
      const title = STATIC_TITLES[route.name] ?? 'No encontrado';
      return { title, breadcrumb: [HOME, { label: title }], allowed: true };
    }
  }
}
