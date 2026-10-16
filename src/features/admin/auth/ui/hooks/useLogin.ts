// Envío del formulario de login y vuelta a la página que se pedía.
import * as React from 'react';
import { api, ApiError } from '@/features/admin/core/ui/api';

/** Solo se vuelve a rutas del propio admin, nunca a una URL externa. */
function safeNext() {
  const next = new URLSearchParams(location.search).get('next') ?? '';
  return next.startsWith('/admin') && !next.startsWith('//') && !next.startsWith('/admin/login') ? next : '/admin';
}

export function useLogin() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const submit = React.useCallback(async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(undefined);
    try {
      await api('/auth/login', { method: 'POST', body: values });
      location.href = safeNext();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar. Inténtalo de nuevo.');
      setLoading(false);
    }
  }, []);

  return { loading, error, submit };
}
