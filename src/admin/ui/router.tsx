// Navegación del panel sin recargar la página. El shell (sidebar, cabecera) se monta una vez; al cambiar de ruta
// solo cambia el contenido. Los enlaces <a href="/admin/..."> normales se interceptan, así que el Sidebar y el
// Breadcrumb de nuvo-ui funcionan sin cambios. Ctrl/Cmd+clic y clic central siguen abriendo pestaña nueva.
import * as React from 'react';

interface Router {
  /** Ruta actual (pathname + search). */
  path: string;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
}

const RouterContext = React.createContext<Router | null>(null);

export const useRouter = () => {
  const ctx = React.useContext(RouterContext);
  if (!ctx) throw new Error('useRouter debe usarse dentro de <RouterProvider>');
  return ctx;
};

const current = () => location.pathname.replace(/\/+$/, '') + location.search || '/admin';

/** Solo se navega en cliente dentro del panel; el login y lo demás cargan página. */
const isAppPath = (pathname: string) =>
  (pathname === '/admin' || pathname.startsWith('/admin/')) && !pathname.startsWith('/admin/login');

export function RouterProvider({ children }: { children: React.ReactNode }) {
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
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a');
      if (!a || !a.getAttribute('href') || a.target || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !isAppPath(url.pathname)) return;
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

  const value = React.useMemo(() => ({ path, navigate }), [path, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

/** Carga datos de la API para una vista. `reload` vuelve a pedirlos. */
export function useApiData<T>(path: string | null) {
  const [state, setState] = React.useState<{ data: T | null; error: string; loading: boolean }>({
    data: null,
    error: '',
    loading: !!path,
  });
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!path) return;
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: '' }));
    fetch(`/api/admin${path}`, { signal: ctrl.signal, credentials: 'same-origin' })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) {
          location.href = `/admin/login?next=${encodeURIComponent(location.pathname + location.search)}`;
          return;
        }
        if (!res.ok) throw new Error(body.error ?? 'No se pudieron cargar los datos.');
        setState({ data: body as T, error: '', loading: false });
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setState({ data: null, error: e.message, loading: false });
      });
    return () => ctrl.abort();
  }, [path, tick]);

  const reload = React.useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
