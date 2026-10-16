// Login del panel con la identidad de la landing: foto de la finca y los colores y tipografías de la plantilla publicada
// (los pone src/pages/admin/login.astro).
import * as React from 'react';
import { Login } from '@/shared/ui/login';
import { useLogin } from './hooks/useLogin';
import type { LoginViewProps } from './LoginView.types';

export function LoginView({ image, brand, tagline, logo, title, text }: Readonly<LoginViewProps>) {
  const { loading, error, submit } = useLogin();

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
            <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">{tagline}</p>
            <h2 className="mt-4 text-5xl leading-[1.1] text-foreground">{title}</h2>
            {text && <p className="mt-4 text-sm text-foreground/70">{text}</p>}
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
                src={logo}
                alt={brand}
                width={96}
                height={96}
                className="size-24 rounded-full bg-white object-contain shadow-lg shadow-black/30"
              />
            }
          />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Acceso solo para el equipo. ¿Problemas para entrar? Pide a un administrador que te restablezca la contraseña.
          </p>
        </div>
      </section>
    </main>
  );
}
