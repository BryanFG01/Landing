// Tipos de AdminApp.tsx y de sus rutas (AdminRoutes, Screen, DashboardRoute, ModuleRoute, EditorRoute).
import type { AdminUser, Appearance, PanelSiteTheme } from '@/features/admin/core/domain/schema';
import type { Nav } from '@/features/admin/core/ui/hooks/useShellState';
import type { Route } from './lib/routes';

export interface DashboardRouteProps {
  user: AdminUser;
}

export interface ModuleRouteProps {
  moduleKey: string;
  user: AdminUser;
}

export interface EditorRouteProps {
  id: number | null;
}

export interface ScreenProps {
  route: Route;
  user: AdminUser;
}

export interface RoutesProps {
  user: AdminUser;
}

export interface AdminAppProps {
  user: AdminUser;
  nav: Nav;
  appearance: Appearance;
  /** Plantilla publicada de la web (colores del panel). */
  siteTheme: PanelSiteTheme | null;
}
