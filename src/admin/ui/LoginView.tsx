import * as React from 'react';
import { Login } from '../../components/ui/login';
import { api, ApiError } from './api';
import { Icon } from './icons';

/** Solo se vuelve a rutas del propio admin, nunca a una URL externa. */
function safeNext() {
  const next = new URLSearchParams(location.search).get('next') ?? '';
  return next.startsWith('/admin') && !next.startsWith('//') && !next.startsWith('/admin/login') ? next : '/admin';
}

export function LoginView() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>();

  async function submit(values: { email: string; password: string }) {
    setLoading(true);
    setError(undefined);
    try {
      await api('/auth/login', { method: 'POST', body: values });
      location.href = safeNext();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar. Inténtalo de nuevo.');
      setLoading(false);
    }
  }

  return (
    // El componente Login ya trae su tarjeta; aquí solo el fondo.
    <main className="grid min-h-dvh place-items-center bg-muted/40">
      <div className="w-full max-w-sm">
        <Login
          onSubmit={submit}
          loading={loading}
          error={error}
          title="Panel de administración"
          subtitle="Finca La Esperanza"
          logo={
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Icon name="egg" className="size-5" />
            </span>
          }
        />
      </div>
    </main>
  );
}
