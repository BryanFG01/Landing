// Monta el shell una sola vez y cambia solo la pantalla según la ruta (o avisa si no hay permiso).
import * as React from 'react';
import { LoadError } from '@/features/admin/core/ui/PageStates';
import type { RoutesProps } from './AdminApp.types';
import { AdminShell } from './AdminShell';
import { useCurrentRoute } from './hooks/useCurrentRoute';
import { Screen } from './Screen';

export function AdminRoutes({ user }: Readonly<RoutesProps>) {
  const { route, breadcrumb, allowed } = useCurrentRoute(user);
  return (
    <AdminShell user={user} breadcrumb={breadcrumb}>
      {allowed ? <Screen route={route} user={user} /> : <LoadError message="Esta parte del panel es solo para administradores." />}
    </AdminShell>
  );
}
