// Muestra de las filas que devuelve la consulta al probarla.
import * as React from 'react';
import { COLUMN_TYPES } from '@/features/admin/core/domain/schema';
import { previewCell } from '../lib/moduleEditor';
import type { EditorProps } from '../types';

export function QueryPreviewTable({ editor }: Readonly<EditorProps>) {
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
