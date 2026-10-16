// Estados comunes de una pantalla del panel: cargando (aquí) y error al cargar (LoadError.tsx).
import * as React from 'react';
import { Skeleton } from '@/shared/ui/skeleton';

// Las pantallas importan LoadError desde aquí: se reexporta para no romperlas.
export { LoadError } from './LoadError';

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
