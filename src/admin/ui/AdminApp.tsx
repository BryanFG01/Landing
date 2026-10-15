// Raíz del panel: una sola isla React para todo /admin. El shell se monta una vez y el enrutador cambia solo el
// contenido; cada vista pide sus datos a la API. Así cambiar de módulo no recarga la página.
import * as React from 'react';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { ToastProvider } from '../../components/ui/toast';
import type { BreadcrumbItem } from '../../components/ui/breadcrumb';
import type { AdminUser, Appearance, ModuleAccess, ModuleDefinition, ModuleGroup } from '../schema';
import { AdminShell } from './AdminShell';
import { AppearanceView } from './AppearanceView';
import { DashboardView, type DashboardStats } from './DashboardView';
import { ModuleEditor } from './ModuleEditor';
import { ModulesList } from './ModulesList';
import { ModuleView } from './ModuleView';
import { AppearanceProvider, NavProvider, useNav, type Nav } from './nav';
import { RouterProvider, useApiData, useRouter } from './router';
import { SqlConsole } from './SqlConsole';
import { UsersView } from './UsersView';

type Mod = ModuleDefinition & { id: number };

type Route =
  | { name: 'dashboard' }
  | { name: 'module'; key: string }
  | { name: 'modules' }
  | { name: 'editor'; id: number | null }
  | { name: 'users' }
  | { name: 'sql' }
  | { name: 'appearance' }
  | { name: 'not-found' };

/** Rutas de configuración: solo administradores. */
const ADMIN_ROUTES = new Set<Route['name']>(['modules', 'editor', 'users', 'sql', 'appearance']);

function matchRoute(path: string): Route {
  const p = path.split('?')[0].replace(/\/+$/, '') || '/admin';
  if (p === '/admin') return { name: 'dashboard' };
  if (p === '/admin/modulos') return { name: 'modules' };
  if (p === '/admin/usuarios') return { name: 'users' };
  if (p === '/admin/sql') return { name: 'sql' };
  if (p === '/admin/apariencia') return { name: 'appearance' };
  let m = p.match(/^\/admin\/m\/([a-z][a-z0-9_]{1,47})$/);
  if (m) return { name: 'module', key: m[1] };
  m = p.match(/^\/admin\/modulos\/(nuevo|\d+)$/);
  if (m) return { name: 'editor', id: m[1] === 'nuevo' ? null : Number(m[1]) };
  return { name: 'not-found' };
}

// ─── Estados de carga ────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando">
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="size-9 rounded-lg" />
        <div className="space-y-2">
          <Skeleton width={180} height={20} />
          <Skeleton width={280} height={14} />
        </div>
      </div>
      <Skeleton className="mb-4 h-24 w-full rounded-xl" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}

function LoadError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert variant="error" title="No se pudo cargar">
      <p>{message}</p>
      <div className="mt-3 flex gap-2">
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Reintentar
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => history.back()}>
          Volver
        </Button>
      </div>
    </Alert>
  );
}

// ─── Vistas con sus datos ────────────────────────────────────────────────────

function DashboardRoute({ user }: { user: AdminUser }) {
  const { data, error, reload } = useApiData<{ stats: DashboardStats }>('/dashboard');
  if (error) return <LoadError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;
  return <DashboardView user={user} stats={data.stats} />;
}

function ModuleRoute({ moduleKey, user }: { moduleKey: string; user: AdminUser }) {
  const { data, error, reload } = useApiData<{ module: Mod; access: ModuleAccess }>(`/m/${moduleKey}/definition`);
  if (error) return <LoadError message={error} onRetry={reload} />;
  // Mientras llega la definición del módulo nuevo no se pinta la del anterior.
  if (!data || data.module.module_key !== moduleKey) return <PageSkeleton />;
  return <ModuleView key={moduleKey} module={data.module} access={data.access} canConfigure={user.role === 'admin'} />;
}

function ModulesRoute() {
  const modules = useApiData<{ modules: Mod[] }>('/modules');
  const groups = useApiData<{ groups: ModuleGroup[] }>('/groups');
  const error = modules.error || groups.error;
  if (error) return <LoadError message={error} onRetry={() => (modules.reload(), groups.reload())} />;
  if (!modules.data || !groups.data) return <PageSkeleton />;
  return <ModulesList modules={modules.data.modules} groups={groups.data.groups} />;
}

function EditorRoute({ id }: { id: number | null }) {
  const current = useApiData<{ module: Mod; record_count: number }>(id ? `/modules/${id}` : null);
  const modules = useApiData<{ modules: Mod[] }>('/modules');
  const groups = useApiData<{ groups: ModuleGroup[] }>('/groups');
  const error = current.error || modules.error || groups.error;
  if (error) return <LoadError message={error} />;
  if ((id && current.data?.module.id !== id) || !modules.data || !groups.data) return <PageSkeleton />;
  return (
    <ModuleEditor
      key={id ?? 'nuevo'}
      initial={id ? current.data!.module : null}
      recordCount={current.data?.record_count ?? 0}
      groups={groups.data.groups}
      modules={modules.data.modules}
    />
  );
}

// ─── Enrutado ────────────────────────────────────────────────────────────────

function Routes({ user }: { user: AdminUser }) {
  const { path } = useRouter();
  const { nav } = useNav();
  const route = matchRoute(path);

  const home = { label: 'Inicio', href: '/admin' };
  const builder = { label: 'Constructor', href: '/admin/modulos' };
  let breadcrumb: BreadcrumbItem[] = [home];
  let title = 'Inicio';
  let content: React.ReactNode;

  switch (route.name) {
    case 'dashboard':
      content = <DashboardRoute user={user} />;
      break;
    case 'module': {
      title = nav.modules.find((m) => m.module_key === route.key)?.name ?? 'Módulo';
      breadcrumb = [home, { label: title }];
      content = <ModuleRoute moduleKey={route.key} user={user} />;
      break;
    }
    case 'modules':
      title = 'Constructor de módulos';
      breadcrumb = [home, builder];
      content = <ModulesRoute />;
      break;
    case 'editor': {
      const name = route.id ? nav.modules.find((m) => m.id === route.id)?.name : null;
      title = route.id ? `Configurar ${name ?? 'módulo'}` : 'Nuevo módulo';
      breadcrumb = [home, builder, { label: route.id ? (name ?? 'Configurar') : 'Nuevo módulo' }];
      content = <EditorRoute key={route.id ?? 'nuevo'} id={route.id} />;
      break;
    }
    case 'users':
      title = 'Usuarios y permisos';
      breadcrumb = [home, { label: title }];
      content = <UsersView me={user} />;
      break;
    case 'sql':
      title = 'Consola SQL';
      breadcrumb = [home, { label: title }];
      content = <SqlConsole />;
      break;
    case 'appearance':
      title = 'Apariencia';
      breadcrumb = [home, { label: title }];
      content = <AppearanceView />;
      break;
    default:
      title = 'No encontrado';
      breadcrumb = [home, { label: title }];
      content = <LoadError message="Esta página del panel no existe." />;
  }

  if (ADMIN_ROUTES.has(route.name) && user.role !== 'admin') {
    title = 'Sin acceso';
    breadcrumb = [home, { label: title }];
    content = <LoadError message="Esta parte del panel es solo para administradores." />;
  }

  React.useEffect(() => {
    document.title = `${title} · Admin`;
  }, [title]);

  return (
    <AdminShell user={user} breadcrumb={breadcrumb}>
      {content}
    </AdminShell>
  );
}

export default function AdminApp({ user, nav, appearance }: { user: AdminUser; nav: Nav; appearance: Appearance }) {
  return (
    <ToastProvider>
      <AppearanceProvider initial={appearance}>
        <NavProvider initial={nav}>
          <RouterProvider>
            <Routes user={user} />
          </RouterProvider>
        </NavProvider>
      </AppearanceProvider>
    </ToastProvider>
  );
}
