// Tabla de módulos del constructor. Las columnas se declaran con DataTable.Column para que las celdas con enlaces y
// botones se pinten aquí y no en una función que devuelva JSX.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { DataTable } from '@/shared/ui/data-table';
import { Icon } from '@/features/admin/core/ui/icons';
import type { ModuleRow } from '@/features/admin/core/ui/lib/modules';
import { StatusBadge } from '@/features/admin/core/ui/StatusBadge';
import type { ModulesTableProps } from './ModulesTable.types';

export function ModulesTable({ rows, onOpen, onConfigure }: Readonly<ModulesTableProps>) {
  return (
    <DataTable data={rows} searchable emptyText="Aún no hay módulos. Crea el primero.">
      <DataTable.Column<ModuleRow> columnKey="name" label="Módulo" sortable>
        {({ row }) => (
          <a href={`/admin/modulos/${row.id}`} className="flex items-center gap-2 font-medium hover:text-primary">
            <Icon name={row.icon} className="size-4 text-muted-foreground" />
            {row.name}
          </a>
        )}
      </DataTable.Column>
      <DataTable.Column<ModuleRow> columnKey="module_key" label="Clave">
        {({ value }) => <code className="text-xs">{String(value)}</code>}
      </DataTable.Column>
      <DataTable.Column<ModuleRow> columnKey="group" label="Grupo" sortable />
      <DataTable.Column<ModuleRow> columnKey="source" label="Origen" sortable />
      <DataTable.Column<ModuleRow> columnKey="fields" label="Campos" />
      <DataTable.Column<ModuleRow> columnKey="filters" label="Filtros" />
      <DataTable.Column<ModuleRow> columnKey="is_active" label="Estado">
        {({ value }) => <StatusBadge active={value === true} />}
      </DataTable.Column>
      <DataTable.Column<ModuleRow> columnKey="id" label="">
        {({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => onOpen(row)}>
              Abrir
            </Button>
            <Button variant="outline" size="sm" onClick={() => onConfigure(row)}>
              Configurar
            </Button>
          </div>
        )}
      </DataTable.Column>
    </DataTable>
  );
}
