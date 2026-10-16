// Raíz del panel: una sola isla React para todo /admin. El shell se monta una vez y el enrutador cambia solo el
// contenido; cada pantalla pide sus datos a la API. Así cambiar de módulo no recarga la página.
// Las rutas que cargan datos están en *Route.tsx, la elección de pantalla en Screen.tsx y el shell en AdminRoutes.tsx.
import * as React from 'react';
import { ToastProvider } from '@/shared/ui/toast';
import { AppearanceProvider, NavProvider } from '@/features/admin/core/ui/nav';
import { RouterProvider } from '@/features/admin/core/ui/router';
import type { AdminAppProps } from './AdminApp.types';
import { AdminRoutes } from './AdminRoutes';

export default function AdminApp({ user, nav, appearance, siteTheme }: Readonly<AdminAppProps>) {
  return (
    <ToastProvider>
      <AppearanceProvider initial={appearance} siteTheme={siteTheme}>
        <NavProvider initial={nav}>
          <RouterProvider>
            <AdminRoutes user={user} />
          </RouterProvider>
        </NavProvider>
      </AppearanceProvider>
    </ToastProvider>
  );
}
