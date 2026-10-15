// "Origen de los datos" del módulo: registros del panel, tabla de la base (con su SQL) o consulta SQL (con su prueba).
import * as React from 'react';
import { Alert } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Select } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { cn } from '../../../components/lib/utils';
import { COLUMN_TYPES, SOURCE_TYPES, type SourceType } from '../../schema';
import type { ModuleEditorState } from '../hooks/useModuleEditor';
import { Icon } from '../icons';
import { previewCell, SOURCE_HELP, SOURCE_ICON } from '../lib/moduleEditor';

const QUERY_PLACEHOLDER = "SELECT data->>'estado' AS estado, count(*) AS pedidos\nFROM registros WHERE modulo = 'pedidos'\nGROUP BY 1";

function SqlError({ title, message }: Readonly<{ title: string; message: string }>) {
  if (!message) return null;
  return (
    <Alert variant="error" title={title}>
      <span className="font-mono text-xs whitespace-pre-wrap">{message}</span>
    </Alert>
  );
}

function SourcePicker({ editor }: Readonly<{ editor: ModuleEditorState }>) {
  const { mod, isNew } = editor;
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-3">
        {(Object.entries(SOURCE_TYPES) as [SourceType, string][]).map(([value, label]) => {
          const selected = mod.source_type === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              disabled={!isNew && !selected}
              onClick={() => editor.switchSource(value)}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                selected ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted',
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Icon name={SOURCE_ICON[value]} />
                {label}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">{SOURCE_HELP[value]}</span>
            </button>
          );
        })}
      </div>
      {!isNew && <p className="text-xs text-muted-foreground">El tipo de origen no se cambia en un módulo ya creado.</p>}
    </>
  );
}

function TableSqlEditor({ editor }: Readonly<{ editor: ModuleEditorState }>) {
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

function TableSource({ editor }: Readonly<{ editor: ModuleEditorState }>) {
  const { tables, table, mod } = editor;
  const realTables = (tables ?? []).filter((t) => t.kind === 'tabla');
  const options = realTables.map((t) => ({ value: t.name, label: t.pk ? t.name : `${t.name} (sin clave primaria)`, disabled: !t.pk }));
  return (
    <div className="space-y-3">
      {tables && !realTables.length ? (
        <Alert variant="info" title="Aún no hay tablas en la base">
          Crea la primera aquí mismo con "Crear tabla con SQL".
        </Alert>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <Select
            className="min-w-56 flex-1"
            label="Tabla"
            placeholder={tables ? 'Elegir tabla' : 'Cargando…'}
            options={options}
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

function QueryPreviewTable({ editor }: Readonly<{ editor: ModuleEditorState }>) {
  const preview = editor.query.preview;
  if (!preview?.rows.length) return null;
  return (
    <div className="max-h-64 overflow-auto rounded-lg border border-border">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-muted">
          <tr>
            {preview.columns.map((c) => (
              <th key={c.name} className="px-3 py-2 font-medium whitespace-nowrap">
                {c.name} <span className="font-normal text-muted-foreground">({COLUMN_TYPES[c.type]})</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {preview.rows.map((row, i) => (
            // Filas de muestra sin id propio: la posición es su identidad.
            // eslint-disable-next-line react/no-array-index-key
            <tr key={i}>
              {preview.columns.map((c) => (
                <td key={c.name} className="px-3 py-1.5 font-mono whitespace-nowrap">
                  {previewCell(row[c.name])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuerySource({ editor }: Readonly<{ editor: ModuleEditorState }>) {
  const { mod, query } = editor;
  return (
    <div className="space-y-3">
      <Textarea
        label="Consulta SQL"
        rows={8}
        className="font-mono text-sm"
        spellCheck={false}
        placeholder={QUERY_PLACEHOLDER}
        helperText="Un solo SELECT sobre el esquema datos. Los registros del panel están en la vista registros. Los filtros y el orden se aplican sobre el resultado."
        value={mod.source ?? ''}
        onChange={(e) => editor.draft.set({ source: e.target.value })}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => editor.runPreview()} disabled={query.running || !mod.source?.trim()}>
          <Icon name="terminal" /> {query.running ? 'Probando…' : 'Probar consulta'}
        </Button>
        {query.preview && (
          <span className="text-sm text-muted-foreground">
            {query.preview.columns.length} columnas · {query.preview.rows.length} fila(s) de muestra
          </span>
        )}
      </div>
      <SqlError title="La consulta no funciona" message={query.error} />
      <QueryPreviewTable editor={editor} />
    </div>
  );
}

export function SourceCard({ editor }: Readonly<{ editor: ModuleEditorState }>) {
  const type = editor.mod.source_type;
  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="font-sans text-base font-semibold">Origen de los datos</h2>
        <p className="text-sm text-muted-foreground">De dónde salen las filas que muestra el módulo.</p>
      </div>
      <SourcePicker editor={editor} />
      {type === 'table' && <TableSource editor={editor} />}
      {type === 'query' && <QuerySource editor={editor} />}
    </Card>
  );
}
