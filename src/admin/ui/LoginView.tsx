// Login del panel con la identidad de la landing: foto de la finca, verde, crema y teja, y Hina Mincho en los títulos.
import * as React from 'react';
import { Login } from '../../components/ui/login';
import { api, ApiError } from './api';

/** Solo se vuelve a rutas del propio admin, nunca a una URL externa. */
function safeNext() {
  const next = new URLSearchParams(location.search).get('next') ?? '';
  return next.startsWith('/admin') && !next.startsWith('//') && !next.startsWith('/admin/login') ? next : '/admin';
}

export function LoginView({ image, brand, tagline }: { image: string; brand: string; tagline: string }) {
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
    <main className="grid min-h-dvh bg-background text-foreground lg:grid-cols-[1.15fr_1fr]">
      {/* Foto de la finca: banda arriba en móvil, mitad izquierda en escritorio. */}
      <aside className="relative h-56 overflow-hidden sm:h-72 lg:h-auto">
        <img src={image} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-background/10 lg:bg-linear-to-r lg:from-background/10 lg:via-background/30 lg:to-background" />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/70 via-30% to-transparent to-60%" />

        <div className="relative flex h-full flex-col justify-between p-6 sm:p-10 lg:p-14">
          <a
            href="/"
            className="inline-flex w-max items-center gap-2 rounded-full bg-background/50 px-3 py-1.5 text-xs text-foreground/80 ring-1 ring-foreground/15 backdrop-blur-md transition-colors hover:text-foreground"
          >
            <span aria-hidden="true">←</span> Volver al sitio
          </a>
          <div className="hidden max-w-md lg:block">
            <p className="text-xs font-medium tracking-[0.2em] text-teja uppercase">{tagline}</p>
            <h2 className="mt-4 text-5xl leading-[1.1] text-crema">
              Del campo a tu mesa
            </h2>
            <p className="mt-4 text-sm text-crema/70">
              Gestiona productos, pedidos y todo lo que se ve en la web desde un solo lugar.
            </p>
          </div>
        </div>
      </aside>

      {/* Formulario */}
      <section className="flex flex-col px-4 pb-8 sm:px-8 lg:justify-center lg:px-12">
        <div className="mx-auto w-full max-w-sm -translate-y-10 lg:translate-y-0">
          <Login
            onSubmit={submit}
            loading={loading}
            error={error}
            title="Panel de administración"
            subtitle={brand}
            className="p-0"
            logo={
              <img
                src="/icon-192.png"
                alt={brand}
                width={96}
                height={96}
                className="size-24 rounded-full bg-white shadow-lg shadow-black/30"
              />
            }
          />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Acceso solo para administradores. ¿Problemas para entrar? Pide a otro administrador que te restablezca la
            contraseña.
          </p>
        </div>
      </section>
    </main>
  );
}
