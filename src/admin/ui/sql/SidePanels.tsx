// Paneles laterales de la consola SQL: tablas del esquema datos, ejemplos e historial.
import * as React from 'react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { cn } from '../../../components/lib/utils';
import { Icon } from '../icons';
import { oneLine, SQL_EXAMPLES, type TableInfo } from '../lib/sql';

const HISTORY_SHOWN = 8;

function TableItem({
  table: t,
  onQuery,
  onCreateModule,
}: Readonly<{ table: TableInfo; onQuery: (sql: string) => void; onCreateModule: (name: string) => void }>) {
  const [open, setOpen] = React.useState(false);
  const editable = t.kind === 'tabla' && !!t.pk;
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
      >
        <Icon name={t.kind === 'tabla' ? 'table' : 'eye'} className="size-4 text-muted-foreground" />
        <span className="flex-1 truncate font-mono text-xs">{t.name}</span>
        {t.kind === 'vista' && (
          <Badge variant="muted" size="sm">
            vista
          </Badge>
        )}
      </button>
      {open && (
        <div className="mt-1 mb-2 ml-8 space-y-2">
          <ul className="space-y-0.5 text-xs">
            {t.columns.map((c) => (
              <li key={c.name} className="flex justify-between gap-2">
                <span className={cn('font-mono', c.pk && 'font-semibold text-primary')}>{c.name}</span>
                <span className="truncate text-muted-foreground">{c.type}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="ghost" onClick={() => onQuery(`SELECT * FROM ${t.name} LIMIT 100`)}>
              Ver filas
            </Button>
            {editable && (
              <Button size="sm" variant="outline" onClick={() => onCreateModule(t.name)}>
                Crear módulo
              </Button>
            )}
          </div>
          {t.kind === 'tabla' && !t.pk && (
            <p className="text-xs text-muted-foreground">Sin clave primaria: no se puede editar desde un módulo.</p>
          )}
        </div>
      )}
    </li>
  );
}

export function TablesPanel({
  tables,
  onQuery,
  onCreateModule,
}: Readonly<{ tables: TableInfo[] | null; onQuery: (sql: string) => void; onCreateModule: (name: string) => void }>) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-sans text-sm font-semibold">Tablas en datos</h2>
      {tables ? (
        <ul className="space-y-1">
          {tables.map((t) => (
            <TableItem key={t.name} table={t} onQuery={onQuery} onCreateModule={onCreateModule} />
          ))}
          {tables.length === 0 && <li className="text-sm text-muted-foreground">Aún no hay tablas.</li>}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      )}
    </Card>
  );
}

export function ExamplesPanel({ onPick }: Readonly<{ onPick: (sql: string) => void }>) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-sans text-sm font-semibold">Ejemplos</h2>
      <ul className="space-y-1">
        {SQL_EXAMPLES.map((ex) => (
          <li key={ex.label}>
            <button type="button" onClick={() => onPick(ex.sql)} className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted">
              {ex.label}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Los registros de los módulos del panel están en la vista <code className="font-mono">registros</code> (columnas
        modulo, data, created_at).
      </p>
    </Card>
  );
}

export function HistoryPanel({ history, onPick }: Readonly<{ history: string[]; onPick: (sql: string) => void }>) {
  if (!history.length) return null;
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-sans text-sm font-semibold">Historial</h2>
      <ul className="space-y-1">
        {history.slice(0, HISTORY_SHOWN).map((h) => (
          <li key={h}>
            <button
              type="button"
              onClick={() => onPick(h)}
              className="w-full truncate rounded-md px-2 py-1.5 text-left font-mono text-xs hover:bg-muted"
              title={h}
            >
              {oneLine(h)}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
