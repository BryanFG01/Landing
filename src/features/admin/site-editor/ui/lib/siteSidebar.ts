// Clases de la columna izquierda de Sitio web (sin React).
import { cn } from '@/shared/lib/utils';

/** Clases de una entrada del menú de secciones, resaltada si es la abierta. */
export const navItem = (active: boolean) =>
  cn(
    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
    active ? 'bg-primary/10 font-medium text-primary' : 'hover:bg-muted',
  );
