// Tarjeta con la lista de registros: resumen, orden, tabla y paginación. Las columnas se declaran con
// DataTable.Column para que las celdas se pinten con componentes y no con una función que devuelva JSX.
import * as React from 'react';
import { Card } from '@/shared/ui/card';
import { DataTable } from '@/shared/ui/data-table';
import { Pagination } from '@/shared/ui/pagination';
import type { RecordRow } from '@/features/admin/core/domain/schema';
import { RecordCell } from './RecordCell';
import { RowActions } from './RowActions';
import { SortControl } from './SortControl';
import type { PageProps } from './types';

export function RecordsTable({ page }: Readonly<PageProps>) {
  const { rows, editor, columns, canEdit } = page;
  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {page.summary}
        </p>
        <SortControl options={rows.sortOptions} sort={rows.sort} onField={rows.setSortField} onToggleDir={rows.toggleSortDir} />
      </div>

      <DataTable
        data={rows.rows}
        loading={rows.initialLoading}
        emptyText={page.emptyText}
        className={rows.refreshing ? 'opacity-60 transition-opacity' : 'transition-opacity'}
      >
        {columns.map((column) => (
          <DataTable.Column<RecordRow> key={column.id} columnKey={column.config.column} label={column.config.headerText}>
            {({ value, row }) => (
              <RecordCell column={column} value={value} row={row} relationOptions={rows.relationOptions} onStatus={editor.setStatus} />
            )}
          </DataTable.Column>
        ))}
        {canEdit && (
          <DataTable.Column<RecordRow> columnKey="__actions" label="">
            {({ row }) => <RowActions row={row} onEdit={editor.open} onDelete={editor.askDelete} />}
          </DataTable.Column>
        )}
      </DataTable>

      <div className="mt-4 flex justify-end">
        <Pagination currentPage={rows.page} totalPages={rows.totalPages} onChange={rows.setPage} />
      </div>
    </Card>
  );
}
