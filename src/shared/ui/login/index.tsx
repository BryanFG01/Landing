"use client"

import { Input } from "../input"
import { Button } from "../button"
import { cn } from "@/shared/lib/utils"
import type { LoginProps } from './types';
import { ErrorBubble } from './ErrorBubble';
import { ALERT_ICON, EYE_CLOSED_ICON, EYE_OPEN_ICON, SPINNER_ICON } from './icons';
import { useLogin } from './useLogin';

export type { LoginProps } from './types';

// ─── Componente ───────────────────────────────────────────────────────────────

export function Login({
  onSubmit,
  loading  = false,
  error,
  title    = "Bienvenido de nuevo",
  subtitle = "Ingresa tus credenciales para continuar",
  logo,
  className,
  forgotPasswordHref,
  signUpHref,
}: LoginProps) {
  const form = useLogin(onSubmit)
  const { fieldErrors, showPassword } = form

  return (
    /* Sin bg ni blobs — el padre controla el fondo */
    <div className={cn("relative flex h-full w-full items-center justify-center p-4", className)}>
      <div className="w-full max-w-sm">

        {/* Borde degradado de 1 px */}
        <div
          className="rounded-2xl p-px shadow-2xl shadow-black/30"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--border)), hsl(var(--primary) / 0.35), hsl(var(--border) / 0.6))",
          }}
        >
          <div className="rounded-[15px] bg-background/90 p-8 backdrop-blur-xl">

            {/* Logo opcional */}
            {logo && <div className="mb-6 flex justify-center">{logo}</div>}

            {/* Encabezado */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </div>

            {/* Error del servidor */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
                <span className="mt-px shrink-0">{ALERT_ICON}</span>
                {error}
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={form.handleSubmit} noValidate className="space-y-5">

              {/* Email */}
              <div className="relative">
                <Input
                  label="Correo electrónico"
                  type="email"
                  placeholder="nombre@empresa.com"
                  value={form.email}
                  onChange={e => form.changeEmail(e.target.value)}
                  variant={fieldErrors.email ? "error" : "default"}
                  autoComplete="email"
                  disabled={loading}
                />
                {fieldErrors.email && <ErrorBubble message={fieldErrors.email} />}
              </div>

              {/* Contraseña con toggle */}
              <div className="relative">
                <div className="relative">
                  <Input
                    label="Contraseña"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => form.changePassword(e.target.value)}
                    variant={fieldErrors.password ? "error" : "default"}
                    autoComplete="current-password"
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={form.togglePassword}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute bottom-2 right-3 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  >
                    {showPassword ? EYE_CLOSED_ICON : EYE_OPEN_ICON}
                  </button>
                </div>
                {fieldErrors.password && <ErrorBubble message={fieldErrors.password} />}
              </div>

              {/* ¿Olvidaste tu contraseña? — solo si hay a dónde llevar */}
              {forgotPasswordHref && (
                <div className="flex justify-end">
                  <a href={forgotPasswordHref} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <>{SPINNER_ICON} Iniciando sesión...</> : "Iniciar sesión"}
              </Button>
            </form>

            {/* Pie — solo si hay registro */}
            {signUpHref && (
              <p className="mt-6 text-center text-xs text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <a href={signUpHref} className="font-medium text-primary hover:underline">Crear cuenta</a>
              </p>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
