// Marco del panel: menú lateral, cabecera (migas, tema, menú de usuario) y el contenido de la pantalla actual.
import * as React from 'react';
import { Breadcrumb, type BreadcrumbItem } from '../../components/ui/breadcrumb';
import { Button } from '../../components/ui/button';
import { DashboardHeader, DashboardLayout } from '../../components/ui/dashboard-layout';
import {
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSeparator,
  DropdownTrigger,
} from '../../components/ui/dropdown';
import { Sidebar } from '../../components/ui/sidebar';
import type { AdminUser } from '../schema';
import { usePendingAlerts } from './hooks/usePendingAlerts';
import { useTheme } from './hooks/useShellState';
import { logout, useSidebar } from './hooks/useSidebar';
import { Icon } from './icons';
import { useAppearance } from './nav';

function Brand() {
  const { appearance } = useAppearance();
  return (
    <a href="/admin" className="flex items-center gap-2.5">
      <img
        src={appearance.logo || '/icon-192.png'}
        alt=""
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-full bg-white object-contain"
      />
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-display text-base">{appearance.name}</span>
        {appearance.subtitle && (
          <span className="block truncate text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            {appearance.subtitle}
          </span>
        )}
      </span>
    </a>
  );
}

function UserMenu({ user, isAdmin, onUsers }: Readonly<{ user: AdminUser; isAdmin: boolean; onUsers: () => void }>) {
  return (
    <DropdownMenu>
      <DropdownTrigger>
        <button
          type="button"
          className="grid size-8 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Menú de usuario"
        >
          {user.name.trim().charAt(0).toUpperCase()}
        </button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-56">
        <DropdownLabel>
          <span className="block truncate text-foreground">{user.name}</span>
          <span className="block truncate font-normal">{user.email}</span>
        </DropdownLabel>
        <DropdownSeparator />
        {isAdmin && (
          <DropdownItem icon={<Icon name="user-gear" />} onClick={onUsers}>
            Usuarios y permisos
          </DropdownItem>
        )}
        <DropdownItem icon={<Icon name="sign-out" />} destructive onClick={logout}>
          Cerrar sesión
        </DropdownItem>
      </DropdownContent>
    </DropdownMenu>
  );
}

interface AdminShellProps {
  user: AdminUser;
  breadcrumb: BreadcrumbItem[];
  children: React.ReactNode;
}

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
