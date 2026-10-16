// Lista de errores de validación devueltos por la API (configuración de un módulo, apariencia, sitio…).
import * as React from 'react';
import { Alert } from '@/shared/ui/alert';
import type { ErrorListProps } from './ErrorList.types';

export function ErrorList({ title, errors }: Readonly<ErrorListProps>) {
  if (!errors.length) return null;
  return (
    <Alert variant="error" title={title} className="mb-4">
      <ul className="list-disc space-y-0.5 pl-4">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </Alert>
  );
}
