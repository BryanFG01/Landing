// Error de SQL tal cual lo devuelve la base (monoespaciado y respetando saltos de línea).
import * as React from 'react';
import { Alert } from '@/shared/ui/alert';
import type { SqlErrorProps } from './SqlError.types';

export function SqlError({ title, message }: Readonly<SqlErrorProps>) {
  if (!message) return null;
  return (
    <Alert variant="error" title={title}>
      <span className="font-mono text-xs whitespace-pre-wrap">{message}</span>
    </Alert>
  );
}
