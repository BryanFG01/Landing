// Estados comunes de una pantalla del panel: cargando y error al cargar.
import * as React from 'react';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';

export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando">
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="size-9 rounded-lg" />
        <div className="space-y-2">
          <Skeleton width={180} height={20} />
          <Skeleton width={280} height={14} />
        </div>
      </div>
      <Skeleton className="mb-4 h-24 w-full rounded-xl" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}

export function LoadError({ message, onRetry }: Readonly<{ message: string; onRetry?: () => void }>) {
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
