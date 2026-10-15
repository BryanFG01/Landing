// Carga datos de la API para una vista. `reload` vuelve a pedirlos; un 401 manda al login (lo hace api()).
import * as React from 'react';
import { api, errorMessage, isAbort } from '../api';

export interface ApiData<T> {
  data: T | null;
  error: string;
  loading: boolean;
  reload: () => void;
}

export function useApiData<T>(path: string | null): ApiData<T> {
  const [state, setState] = React.useState<Omit<ApiData<T>, 'reload'>>({ data: null, error: '', loading: !!path });
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!path) return;
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: '' }));
    api<T>(path, { signal: ctrl.signal })
      .then((data) => setState({ data, error: '', loading: false }))
      .catch((e) => {
        if (!isAbort(e)) setState({ data: null, error: errorMessage(e, 'No se pudieron cargar los datos.'), loading: false });
      });
    return () => ctrl.abort();
  }, [path, tick]);

  const reload = React.useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
