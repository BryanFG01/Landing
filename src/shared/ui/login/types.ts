import type * as React from 'react';

export interface LoginProps {
  onSubmit?: (values: { email: string; password: string }) => void | Promise<void>;
  loading?: boolean;
  error?: string;
  title?: string;
  subtitle?: string;
  logo?: React.ReactNode;
  className?: string;
  /** Enlace de "¿Olvidaste tu contraseña?". Sin él no se muestra. */
  forgotPasswordHref?: string;
  /** Enlace de "Crear cuenta". Sin él no se muestra. */
  signUpHref?: string;
}

/** Errores de validación por campo; sin clave, el campo está bien. */
export interface LoginFieldErrors {
  email?: string;
  password?: string;
}

export interface ErrorBubbleProps {
  message: string;
}
