import type * as React from 'react';
import { useState } from 'react';
import { validateLogin } from './lib';
import type { LoginFieldErrors, LoginProps } from './types';

/** Estado del formulario de acceso: valores, errores por campo, ver/ocultar contraseña y envío. */
export function useLogin(onSubmit: LoginProps['onSubmit']) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});

  // Al escribir en un campo se borra su error para no regañar mientras se corrige.
  function changeEmail(value: string) {
    setEmail(value);
    setFieldErrors((prev) => ({ ...prev, email: undefined }));
  }

  function changePassword(value: string) {
    setPassword(value);
    setFieldErrors((prev) => ({ ...prev, password: undefined }));
  }

  function togglePassword() {
    setShowPassword((visible) => !visible);
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors = validateLogin(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setFieldErrors({});
    await onSubmit?.({ email, password });
  }

  return { email, password, showPassword, fieldErrors, changeEmail, changePassword, togglePassword, handleSubmit };
}
