import { flexRender } from '@tanstack/react-table';
import { cn } from '@/shared/lib/utils';
import { sortIndicator } from './lib';
import type { DataTableHeaderProps } from './types';

/** Cabecera de la tabla; las columnas ordenables cambian de orden al hacer clic. */
export function DataTableHeader<T extends Record<string, unknown>>({ headerGroups }: Readonly<DataTableHeaderProps<T>>) {
  return (
    <thead className="border-b border-border bg-muted/50">
      {headerGroups.map((hg) => (
        <tr key={hg.id}>
          {hg.headers.map((header) => {
            const { ariaSort, arrow } = sortIndicator(header.column.getIsSorted());
            return (
              <th
                key={header.id}
                scope="col"
                style={header.column.columnDef.size ? { width: header.column.columnDef.size } : undefined}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                  header.column.getCanSort() && 'cursor-pointer select-none hover:text-foreground transition-colors',
                )}
                onClick={header.column.getToggleSortingHandler()}
                aria-sort={ariaSort}
              >
                <span className="inline-flex items-center gap-1">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getCanSort() && (
                    <span className="text-muted-foreground/50" aria-hidden="true">
                      {arrow}
                    </span>
                  )}
                </span>
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}
