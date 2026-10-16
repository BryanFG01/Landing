import { cn } from '@/shared/lib/utils';
import type { DataTablePaginationProps } from './types';

/** Pie con la página actual y los botones anterior/siguiente. */
export function DataTablePagination({
  pageNumber,
  pageCount,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
}: Readonly<DataTablePaginationProps>) {
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Página {pageNumber} de{' '}
        {pageCount}
      </span>
      <div className="flex gap-2">
        <button
          onClick={onPrevious}
          disabled={!canPrevious}
          className={cn(
            'rounded-md border border-border px-3 py-1 text-sm transition-colors',
            'hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40',
          )}
          aria-label="Página anterior"
        >
          ← Anterior
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className={cn(
            'rounded-md border border-border px-3 py-1 text-sm transition-colors',
            'hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40',
          )}
          aria-label="Página siguiente"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
