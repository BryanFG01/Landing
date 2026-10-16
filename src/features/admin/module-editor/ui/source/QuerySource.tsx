// Origen "consulta SQL": el SELECT del módulo y su prueba con una muestra de filas.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Icon } from '@/features/admin/core/ui/icons';
import { QueryPreviewTable } from './QueryPreviewTable';
import { SqlError } from './SqlError';
import type { EditorProps } from '../types';

const QUERY_PLACEHOLDER = "SELECT data->>'estado' AS estado, count(*) AS pedidos\nFROM registros WHERE modulo = 'pedidos'\nGROUP BY 1";

export function QuerySource({ editor }: Readonly<EditorProps>) {
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
