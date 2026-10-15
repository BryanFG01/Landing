// Ruta actual del panel con su título y migas; mantiene el título de la pestaña del navegador.
import * as React from 'react';
import type { AdminUser } from '../../schema';
import { matchRoute, routeMeta } from '../lib/routes';
import { useNav } from '../nav';
import { useRouter } from '../router';

export function useCurrentRoute(user: AdminUser) {
  const { path } = useRouter();
  const { nav } = useNav();
  const route = React.useMemo(() => matchRoute(path), [path]);
  const meta = React.useMemo(() => routeMeta(route, nav, user), [route, nav, user]);

  React.useEffect(() => {
    document.title = `${meta.title} · Admin`;
  }, [meta.title]);

  return { route, ...meta };
}
