// Resultado de una sentencia de la consola: tabla de filas o resumen del cambio.
import * as React from 'react';
import { Badge } from '../../../components/ui/badge';
import { cellText, type SqlResult } from '../lib/sql';

function Cell({ value }: Readonly<{ value: unknown }>) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">NULL</span>;
  return <>{cellText(value)}</>;
}

export function ResultView({ result }: Readonly<{ result: SqlResult }>) {
  if (!result.columns.length) {
    return (
      <p className="text-sm">
        <Badge variant="success" size="sm">
          {result.command || 'OK'}
        </Badge>{' '}
        {result.rowCount !== null && <span className="text-muted-foreground">{result.rowCount} fila(s) afectada(s)</span>}
      </p>
    );
  }
  return (
    <div>
      <p className="mb-2 text-sm text-muted-foreground">
        {result.rows.length} fila(s){result.truncated && ' (se muestran las primeras 500)'}
      </p>
      <div className="max-h-[55dvh] overflow-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-muted">
            <tr>
              {result.columns.map((c) => (
                <th key={c} className="px-3 py-2 font-medium whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {result.rows.map((row, i) => (
              // Las filas de un resultado no tienen id propio: el índice es su identidad.
              // eslint-disable-next-line react/no-array-index-key
              <tr key={i} className="hover:bg-muted/50">
                {row.map((v, j) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <td key={j} className="max-w-xs px-3 py-1.5 align-top font-mono text-xs whitespace-nowrap">
                    <Cell value={v} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
