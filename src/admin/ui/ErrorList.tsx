// Lista de errores de validación devueltos por la API (configuración de un módulo, apariencia, sitio…).
import * as React from 'react';
import { Alert } from '../../components/ui/alert';

export function ErrorList({ title, errors }: Readonly<{ title: string; errors: string[] }>) {
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
