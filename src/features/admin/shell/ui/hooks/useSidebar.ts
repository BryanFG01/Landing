// Datos del menú lateral para el shell: secciones con iconos, enlace activo y comportamiento en móvil.
import * as React from 'react';
import type { SidebarSection } from '@/shared/ui/sidebar';
import type { AdminUser } from '@/features/admin/core/domain/schema';
import { api } from '@/features/admin/core/ui/api';
import { iconComponent } from '@/features/admin/core/ui/icons';
import { activeHrefFor, buildMenu } from '../lib/sidebar';
import { useNav } from '@/features/admin/core/ui/nav';
import { useRouter } from '@/features/admin/core/ui/router';

const MOBILE_MAX = 768;

export function useSidebar(user: AdminUser) {
  const { nav } = useNav();
  const { path: fullPath, navigate } = useRouter();
  const path = fullPath.split('?')[0];
  const isAdmin = user.role === 'admin';

  const menu = React.useMemo(() => buildMenu(nav, isAdmin), [nav, isAdmin]);
  const sections = React.useMemo<SidebarSection[]>(
    () => menu.map((s) => ({ section: s.section, items: s.items.map((i) => ({ ...i, icon: iconComponent(i.icon) })) })),
    [menu],
  );

  // En móvil el menú se superpone al contenido y cada página empieza con él plegado.
  const mobile = window.innerWidth < MOBILE_MAX;
  const storageKey = mobile ? 'finca-admin-sidebar-movil' : 'finca-admin-sidebar';
  if (mobile) {
    try {
      localStorage.setItem(storageKey, 'collapsed');
    } catch {
      // Sin almacenamiento: el componente usa su valor por defecto (plegado en móvil).
    }
  }

  return {
    sections,
    activeHref: activeHrefFor(menu, path),
    mobile,
    storageKey,
    // En móvil el menú se vuelve a montar al cambiar de ruta para plegarse tras elegir una opción.
    sidebarKey: mobile ? path : 'sidebar',
    isAdmin,
    navigate,
  };
}

/** Cierra la sesión y vuelve al login (aunque la petición falle, la cookie deja de servir al caducar). */
export async function logout() {
  await api('/auth/logout', { method: 'POST' }).catch(() => {});
  location.href = '/admin/login';
}
