// Origen "tabla de la base": elegir la tabla, traer sus columnas y escribir su SQL.
import * as React from 'react';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Select } from '@/shared/ui/select';
import { TableSqlEditor } from './TableSqlEditor';
import type { EditorProps } from '../types';

export function TableSource({ editor }: Readonly<EditorProps>) {
  const { tables, tableSource, table, mod } = editor;
  return (
    <div className="space-y-3">
      {tableSource.noTables ? (
        <Alert variant="info" title="Aún no hay tablas en la base">
          Crea la primera aquí mismo con "Crear tabla con SQL".
        </Alert>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <Select
            className="min-w-56 flex-1"
            label="Tabla"
            placeholder={tables ? 'Elegir tabla' : 'Cargando…'}
            options={tableSource.options}
            value={mod.source ?? undefined}
            onValueChange={(name) => editor.draft.set({ source: name })}
          />
          <Button variant="outline" disabled={!table?.pk} onClick={() => table && editor.applyTable(table)}>
            Traer columnas
          </Button>
        </div>
      )}
      {table && (
        <p className="text-xs text-muted-foreground">
          Clave primaria: <code className="font-mono">{table.pk ?? '—'}</code> · {table.columns.length} columnas. "Traer columnas"
          rehace campos, columnas y filtros con lo que tiene la tabla.
        </p>
      )}
      <TableSqlEditor editor={editor} />
    </div>
  );
}
