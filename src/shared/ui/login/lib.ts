import type { LoginFieldErrors } from './types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valida el formulario de acceso; devuelve un objeto vacío si todo está bien. */
export function validateLogin(email: string, password: string): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  if (!email.trim()) errors.email = 'El correo es obligatorio.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Ingresa un correo válido.';
  if (!password.trim()) errors.password = 'La contraseña es obligatoria.';
  return errors;
}
