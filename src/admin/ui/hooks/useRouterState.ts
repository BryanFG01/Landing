// Navegación del panel sin recargar la página. El shell (sidebar, cabecera) se monta una vez; al cambiar de ruta
// solo cambia el contenido. Los enlaces <a href="/admin/..."> normales se interceptan, así que el Sidebar y el
// Breadcrumb de nuvo-ui funcionan sin cambios. Ctrl/Cmd+clic y clic central siguen abriendo pestaña nueva.
import * as React from 'react';

export interface Router {
  /** Ruta actual (pathname + search). */
  path: string;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
}

const current = () => location.pathname.replace(/\/+$/, '') + location.search || '/admin';

/** Solo se navega en cliente dentro del panel; el login y la vista previa de la web cargan página. */
export const isAppPath = (pathname: string) =>
  (pathname === '/admin' || pathname.startsWith('/admin/')) &&
  !pathname.startsWith('/admin/login') &&
  !pathname.startsWith('/admin/vista-previa');

/** Clic que el enrutador puede atender: botón principal, sin teclas modificadoras, enlace interno sin target. */
function internalLink(e: MouseEvent): URL | null {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const a = (e.target as Element | null)?.closest?.('a');
  if (!a?.getAttribute('href') || a.target || a.hasAttribute('download')) return null;
  const url = new URL(a.href, location.href);
  return url.origin === location.origin && isAppPath(url.pathname) ? url : null;
}

export function useRouterState(): Router {
  const [path, setPath] = React.useState(current);

  const navigate = React.useCallback((to: string, opts: { replace?: boolean } = {}) => {
    const url = new URL(to, location.href);
    if (url.origin !== location.origin || !isAppPath(url.pathname)) {
      location.href = url.href;
      return;
    }
    const next = url.pathname + url.search;
    if (next === location.pathname + location.search) return;
    history[opts.replace ? 'replaceState' : 'pushState'](null, '', next);
    setPath(current());
    document.querySelector('main')?.scrollTo({ top: 0 });
  }, []);

  React.useEffect(() => {
    const onPop = () => setPath(current());
    const onClick = (e: MouseEvent) => {
      const url = internalLink(e);
      if (!url) return;
      e.preventDefault();
      navigate(url.pathname + url.search);
    };
    addEventListener('popstate', onPop);
    document.addEventListener('click', onClick);
    return () => {
      removeEventListener('popstate', onPop);
      document.removeEventListener('click', onClick);
    };
  }, [navigate]);

  return React.useMemo(() => ({ path, navigate }), [path, navigate]);
}
