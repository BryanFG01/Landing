// Raíz del panel: una sola isla React para todo /admin. El shell se monta una vez y el enrutador cambia solo el
// contenido; cada pantalla pide sus datos a la API. Así cambiar de módulo no recarga la página.
import * as React from 'react';
import { ToastProvider } from '../../components/ui/toast';
import type { AdminUser, Appearance, DashboardStats, ModuleAccess, ModuleDefinition, ModuleGroup, PanelSiteTheme } from '../schema';
import { AdminShell } from './AdminShell';
import { AppearanceView } from './AppearanceView';
import { DashboardView } from './DashboardView';
import { useApiData } from './hooks/useApiData';
import { useCurrentRoute } from './hooks/useCurrentRoute';
import type { Route } from './lib/routes';
import { ModuleEditor } from './ModuleEditor';
import { ModulesList } from './ModulesList';
import { ModuleView } from './ModuleView';
import { AppearanceProvider, NavProvider, type Nav } from './nav';
import { LoadError, PageSkeleton } from './PageStates';
import { RouterProvider } from './router';
import { SiteEditor } from './SiteEditor';
import { SqlConsole } from './SqlConsole';
import { UsersView } from './UsersView';

type Mod = ModuleDefinition & { id: number };

// ─── Pantallas que cargan datos antes de pintarse ────────────────────────────

function DashboardRoute({ user }: Readonly<{ user: AdminUser }>) {
  const { data, error, reload } = useApiData<{ stats: DashboardStats }>('/dashboard');
  if (error) return <LoadError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;
  return <DashboardView user={user} stats={data.stats} />;
}

function ModuleRoute({ moduleKey, user }: Readonly<{ moduleKey: string; user: AdminUser }>) {
  const { data, error, reload } = useApiData<{ module: Mod; access: ModuleAccess }>(`/m/${moduleKey}/definition`);
  if (error) return <LoadError message={error} onRetry={reload} />;
  // Mientras llega la definición del módulo nuevo no se pinta la del anterior.
  if (data?.module.module_key !== moduleKey) return <PageSkeleton />;
  return <ModuleView key={moduleKey} module={data.module} access={data.access} canConfigure={user.role === 'admin'} />;
}

function ModulesRoute() {
  const modules = useApiData<{ modules: Mod[] }>('/modules');
  const groups = useApiData<{ groups: ModuleGroup[] }>('/groups');
  const error = modules.error || groups.error;
  const retry = () => {
    modules.reload();
    groups.reload();
  };
  if (error) return <LoadError message={error} onRetry={retry} />;
  if (!modules.data || !groups.data) return <PageSkeleton />;
  return <ModulesList modules={modules.data.modules} groups={groups.data.groups} />;
}

function EditorRoute({ id }: Readonly<{ id: number | null }>) {
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

function Screen({ route, user }: Readonly<{ route: Route; user: AdminUser }>) {
  switch (route.name) {
    case 'dashboard':
      return <DashboardRoute user={user} />;
    case 'module':
      return <ModuleRoute moduleKey={route.key} user={user} />;
    case 'modules':
      return <ModulesRoute />;
    case 'editor':
      return <EditorRoute key={route.id ?? 'nuevo'} id={route.id} />;
    case 'users':
      return <UsersView me={user} />;
    case 'sql':
      return <SqlConsole />;
    case 'appearance':
      return <AppearanceView />;
    case 'site':
      return <SiteEditor />;
    default:
      return <LoadError message="Esta página del panel no existe." />;
  }
}

function Routes({ user }: Readonly<{ user: AdminUser }>) {
  const { route, breadcrumb, allowed } = useCurrentRoute(user);
  return (
    <AdminShell user={user} breadcrumb={breadcrumb}>
      {allowed ? <Screen route={route} user={user} /> : <LoadError message="Esta parte del panel es solo para administradores." />}
    </AdminShell>
  );
}

interface AdminAppProps {
  user: AdminUser;
  nav: Nav;
  appearance: Appearance;
  /** Plantilla publicada de la web (colores del panel). */
  siteTheme: PanelSiteTheme | null;
}

export default function AdminApp({ user, nav, appearance, siteTheme }: Readonly<AdminAppProps>) {
  return (
    <ToastProvider>
      <AppearanceProvider initial={appearance} siteTheme={siteTheme}>
        <NavProvider initial={nav}>
          <RouterProvider>
            <Routes user={user} />
          </RouterProvider>
        </NavProvider>
      </AppearanceProvider>
    </ToastProvider>
  );
}
