"use client"

import * as React from "react"
import { Input } from "../input"
import { Button } from "../button"
import { cn } from "../../lib/utils"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface LoginProps {
  onSubmit?: (values: { email: string; password: string }) => void | Promise<void>
  loading?: boolean
  error?: string
  title?: string
  subtitle?: string
  logo?: React.ReactNode
  className?: string
  /** Enlace de "¿Olvidaste tu contraseña?". Sin él no se muestra. */
  forgotPasswordHref?: string
  /** Enlace de "Crear cuenta". Sin él no se muestra. */
  signUpHref?: string
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function EyeOpen() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeClosed() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

// ─── Burbuja de error ─────────────────────────────────────────────────────────

function ErrorBubble({ message }: { message: string }) {
  return (
    <div className="absolute left-0 top-full z-30 mt-1.5 w-max max-w-[260px]">
      {/* Flecha apuntando al campo */}
      <div
        className="ml-3 h-0 w-0"
        style={{
          borderLeft:   "6px solid transparent",
          borderRight:  "6px solid transparent",
          borderBottom: "6px solid hsl(var(--destructive) / 0.5)",
        }}
      />
      {/* Burbuja */}
      <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-background/95 px-3 py-2 text-xs text-destructive shadow-xl backdrop-blur-sm">
        <span className="shrink-0"><AlertIcon /></span>
        {message}
      </div>
    </div>
  )
}

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
  const [email,        setEmail]        = React.useState("")
  const [password,     setPassword]     = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [fieldErrors,  setFieldErrors]  = React.useState<{ email?: string; password?: string }>({})

  function validate(): boolean {
    const e: { email?: string; password?: string } = {}
    if (!email.trim())
      e.email = "El correo es obligatorio."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Ingresa un correo válido."
    if (!password.trim())
      e.password = "La contraseña es obligatoria."
    setFieldErrors(e)
    return !Object.keys(e).length
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setFieldErrors({})
    await onSubmit?.({ email, password })
  }

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
                <span className="mt-px shrink-0"><AlertIcon /></span>
                {error}
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* Email */}
              <div className="relative">
                <Input
                  label="Correo electrónico"
                  type="email"
                  placeholder="nombre@empresa.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: undefined })) }}
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
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: undefined })) }}
                    variant={fieldErrors.password ? "error" : "default"}
                    autoComplete="current-password"
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute bottom-2 right-3 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeClosed /> : <EyeOpen />}
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
                {loading ? <><Spinner /> Iniciando sesión...</> : "Iniciar sesión"}
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
