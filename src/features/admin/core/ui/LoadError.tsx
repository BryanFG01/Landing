// Estado común de una pantalla del panel que no pudo cargar.
import * as React from 'react';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import type { LoadErrorProps } from './PageStates.types';

export function LoadError({ message, onRetry }: Readonly<LoadErrorProps>) {
  return (
    <Alert variant="error" title="No se pudo cargar">
      <p>{message}</p>
      <div className="mt-3 flex gap-2">
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Reintentar
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => history.back()}>
          Volver
        </Button>
      </div>
    </Alert>
  );
}
