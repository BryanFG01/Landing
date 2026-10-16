// Marco del panel: menú lateral, cabecera (migas, tema, menú de usuario) y el contenido de la pantalla actual.
import * as React from 'react';
import { Breadcrumb } from '@/shared/ui/breadcrumb';
import { Button } from '@/shared/ui/button';
import { DashboardHeader, DashboardLayout } from '@/shared/ui/dashboard-layout';
import { Sidebar } from '@/shared/ui/sidebar';
import { useTheme } from '@/features/admin/core/ui/hooks/useShellState';
import { Icon } from '@/features/admin/core/ui/icons';
import type { AdminShellProps } from './AdminShell.types';
import { Brand } from './Brand';
import { usePendingAlerts } from './hooks/usePendingAlerts';
import { useSidebar } from './hooks/useSidebar';
import { UserMenu } from './UserMenu';

export function AdminShell({ user, breadcrumb, children }: Readonly<AdminShellProps>) {
  const sidebar = useSidebar(user);
  const theme = useTheme();
  usePendingAlerts();

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <Sidebar
        key={sidebar.sidebarKey}
        sections={sidebar.sections}
        activeHref={sidebar.activeHref}
        storageKey={sidebar.storageKey}
        defaultCollapsed={sidebar.mobile}
        className="max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-40"
        logo={<Brand />}
        footer={
          <div className="min-w-0 text-xs">
            <p className="truncate font-medium text-foreground">{user.name}</p>
            <p className="truncate text-muted-foreground">{user.email}</p>
          </div>
        }
      />

      <DashboardLayout
        className="min-w-0 flex-1"
        header={
          <DashboardHeader
            left={<Breadcrumb items={breadcrumb} className="min-w-0 pl-4 md:pl-0" />}
            right={
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={theme.toggle}
                  aria-label={theme.dark ? 'Usar tema claro' : 'Usar tema oscuro'}
                >
                  <Icon name={theme.dark ? 'sun' : 'moon'} />
                </Button>
                <UserMenu user={user} isAdmin={sidebar.isAdmin} onUsers={() => sidebar.navigate('/admin/usuarios')} />
              </>
            }
          />
        }
      >
        {/* pl-8 en móvil: deja sitio a la pestaña que despliega el menú colapsado. */}
        <div className="mx-auto w-full max-w-7xl p-4 pl-8 md:p-6">{children}</div>
      </DashboardLayout>
    </div>
  );
}
