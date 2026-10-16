// SQL de la tabla escrito desde el constructor: botones para empezar un CREATE/ALTER TABLE y el editor para ejecutarlo.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Icon } from '@/features/admin/core/ui/icons';
import { SqlError } from './SqlError';
import type { EditorProps } from '../types';

export function TableSqlEditor({ editor }: Readonly<EditorProps>) {
  const { tableSql, table } = editor;
  if (tableSql.sql === null) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={editor.openCreateTableSql}>
          <Icon name="code" /> Crear tabla con SQL
        </Button>
        {table && (
          <Button variant="ghost" size="sm" onClick={editor.openAlterTableSql}>
            <Icon name="code" /> Cambiar columnas de {table.name}
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <Textarea
        label="SQL de la tabla"
        rows={9}
        className="font-mono text-sm"
        spellCheck={false}
        helperText="Se ejecuta en el esquema datos. Al terminar, el módulo trae las columnas de la tabla. Para borrar columnas o tablas, usa la consola SQL."
        value={tableSql.sql}
        onChange={(e) => tableSql.edit(e.target.value)}
      />
      <SqlError title="No se pudo ejecutar" message={tableSql.error} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={editor.runTableSql} disabled={tableSql.running || tableSql.blocked}>
          <Icon name="terminal" /> {tableSql.running ? 'Ejecutando…' : 'Ejecutar y traer columnas'}
        </Button>
        <Button size="sm" variant="ghost" onClick={tableSql.close}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
