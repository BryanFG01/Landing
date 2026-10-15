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
import { Badge } from '../../components/ui/badge';
import { Sidebar, type SidebarSection } from '../../components/ui/sidebar';
import type { AdminUser, NavModule } from '../schema';
import { api } from './api';
import { Icon, iconComponent } from './icons';
import { useAppearance, useNav, type Nav } from './nav';
import { useRouter } from './router';

/** Entradas de Configuración, solo para administradores. */
export const SETTINGS_LINKS = [
  { label: 'Constructor de módulos', href: '/admin/modulos', icon: 'wrench' },
  { label: 'Consola SQL', href: '/admin/sql', icon: 'terminal' },
  { label: 'Usuarios y permisos', href: '/admin/usuarios', icon: 'user-gear' },
  { label: 'Apariencia', href: '/admin/apariencia', icon: 'palette' },
];

/** El sidebar sale de la base de datos: un apartado por grupo, con los módulos activos que el usuario puede ver. */
function buildSections(nav: Nav, isAdmin: boolean): SidebarSection[] {
  const item = (m: NavModule) => ({ label: m.name, href: `/admin/m/${m.module_key}`, icon: iconComponent(m.icon) });
  const sections: SidebarSection[] = [{ section: '', items: [{ label: 'Inicio', href: '/admin', icon: iconComponent('house') }] }];
  for (const g of nav.groups) {
    const items = nav.modules.filter((m) => m.group_id === g.id).map(item);
    if (items.length) sections.push({ section: g.name, items });
  }
  const loose = nav.modules.filter((m) => !m.group_id || !nav.groups.some((g) => g.id === m.group_id)).map(item);
  if (loose.length) sections.push({ section: 'Módulos', items: loose });
  if (isAdmin) {
    sections.push({
      section: 'Configuración',
      items: SETTINGS_LINKS.map((l) => ({ label: l.label, href: l.href, icon: iconComponent(l.icon) })),
    });
  }
  return sections;
}

function useTheme() {
  const [dark, setDark] = React.useState(() => document.documentElement.classList.contains('dark'));
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('admin-theme', next ? 'dark' : 'light');
    } catch {}
  };
  return { dark, toggle };
}

export function AdminShell({
  user,
  breadcrumb,
  children,
}: {
  user: AdminUser;
  breadcrumb: BreadcrumbItem[];
  children: React.ReactNode;
}) {
  const { nav } = useNav();
  const { appearance } = useAppearance();
  const { path: fullPath, navigate } = useRouter();
  const path = fullPath.split('?')[0];
  const isAdmin = user.role === 'admin';
  const sections = React.useMemo(() => buildSections(nav, isAdmin), [nav, isAdmin]);
  const theme = useTheme();
  // Marca como activo el enlace más largo que sea prefijo de la ruta (el editor de un módulo cuelga del constructor).
  const activeHref =
    sections
      .flatMap((s) => s.items.map((i) => i.href))
      .filter((href) => path === href || (href !== '/admin' && path.startsWith(`${href}/`)))
      .sort((a, b) => b.length - a.length)[0] ?? path;

  // En móvil el menú se superpone al contenido y cada página empieza con él plegado.
  const mobile = window.innerWidth < 768;
  const storageKey = mobile ? 'finca-admin-sidebar-movil' : 'finca-admin-sidebar';
  if (mobile) {
    try {
      localStorage.setItem(storageKey, 'collapsed');
    } catch {}
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    location.href = '/admin/login';
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <Sidebar
        // En móvil se vuelve a montar al cambiar de ruta para que el menú se pliegue tras elegir una opción.
        key={mobile ? path : 'sidebar'}
        sections={sections}
        activeHref={activeHref}
        storageKey={storageKey}
        defaultCollapsed={mobile}
        className="max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-40"
        logo={
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
        }
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
                      <DropdownItem icon={<Icon name="user-gear" />} onClick={() => navigate('/admin/usuarios')}>
                        Usuarios y permisos
                      </DropdownItem>
                    )}
                    <DropdownItem icon={<Icon name="sign-out" />} destructive onClick={logout}>
                      Cerrar sesión
                    </DropdownItem>
                  </DropdownContent>
                </DropdownMenu>
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

/** Cabecera de cada página: título, descripción y acciones. */
export function PageHeader({
  title,
  description,
  icon,
  badge,
  actions,
}: {
  title: string;
  description?: string | null;
  icon?: string | null;
  badge?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon name={icon} className="size-5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl leading-tight">
            {title}
            {badge && (
              <Badge variant="muted" size="sm" className="font-sans">
                {badge}
              </Badge>
            )}
          </h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
