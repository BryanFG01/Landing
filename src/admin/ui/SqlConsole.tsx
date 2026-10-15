// Consola SQL sobre el esquema "datos": crear tablas, cargar datos y probar consultas desde el navegador. Por defecto
// es de solo lectura; para modificar hay que activar "Permitir cambios" (y confirmar si borra algo).
import * as React from 'react';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Modal } from '../../components/ui/modal';
import { Switch } from '../../components/ui/switch';
import { cn } from '../../components/lib/utils';
import { PageHeader } from './AdminShell';
import { api, ApiError } from './api';
import { Icon } from './icons';
import { useRouter } from './router';

interface Result {
  command: string;
  rowCount: number | null;
  columns: string[];
  rows: unknown[][];
  truncated: boolean;
}

export interface TableInfo {
  name: string;
  kind: 'tabla' | 'vista';
  pk: string | null;
  columns: { name: string; type: string; pk: boolean; data_type: string }[];
}

/** La consulta pasa al constructor por sessionStorage (puede ser larga para la URL). */
export const QUERY_HANDOFF_KEY = 'admin-nueva-consulta';

const EXAMPLES = [
  {
    label: 'Crear una tabla',
    sql: `CREATE TABLE clientes (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL,
  telefono text,
  barrio text,
  activo boolean NOT NULL DEFAULT true,
  creado timestamptz NOT NULL DEFAULT now()
);`,
  },
  {
    label: 'Insertar filas',
    sql: `INSERT INTO clientes (nombre, telefono, barrio) VALUES
  ('Marta Gómez', '3104587712', 'Centro'),
  ('Julián Rojas', '3157720941', 'La Esperanza');`,
  },
  {
    label: 'Pedidos del mes (registros del panel)',
    sql: `SELECT data->>'estado' AS estado,
       count(*) AS pedidos,
       sum((data->>'total')::numeric) AS total
FROM registros
WHERE modulo = 'pedidos' AND created_at >= date_trunc('month', now())
GROUP BY 1
ORDER BY 2 DESC`,
  },
  {
    label: 'Añadir una columna',
    sql: 'ALTER TABLE clientes ADD COLUMN correo text;',
  },
];

const HISTORY_KEY = 'admin-sql-historial';

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch {
    return [];
  }
}

const DESTRUCTIVE = /\b(drop|truncate|delete)\b/i;
const isSelect = (sql: string) => /^\s*(select|with)\b/i.test(sql) && !sql.trim().replace(/;\s*$/, '').includes(';');

function Cell({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">NULL</span>;
  if (typeof value === 'boolean') return <>{value ? 'true' : 'false'}</>;
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return <>{text.length > 120 ? `${text.slice(0, 120)}…` : text}</>;
}

function ResultView({ result }: { result: Result }) {
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
              <tr key={i} className="hover:bg-muted/50">
                {row.map((v, j) => (
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

export function SqlConsole() {
  const { navigate } = useRouter();
  const [sql, setSql] = React.useState(() => loadHistory()[0] ?? EXAMPLES[2].sql);
  const [allowWrite, setAllowWrite] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [results, setResults] = React.useState<Result[] | null>(null);
  const [ms, setMs] = React.useState(0);
  const [error, setError] = React.useState('');
  const [confirm, setConfirm] = React.useState(false);
  const [tables, setTables] = React.useState<TableInfo[] | null>(null);
  const [open, setOpen] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState(loadHistory);
  const [ranSql, setRanSql] = React.useState('');

  const loadTables = React.useCallback(() => {
    api<{ tables: TableInfo[] }>('/tables')
      .then((r) => setTables(r.tables))
      .catch(() => setTables([]));
  }, []);
  React.useEffect(loadTables, [loadTables]);

  function remember(text: string) {
    const next = [text, ...history.filter((h) => h !== text)].slice(0, 15);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {}
  }

  async function run(force = false) {
    if (!sql.trim() || running) return;
    if (allowWrite && DESTRUCTIVE.test(sql) && !force) {
      setConfirm(true);
      return;
    }
    setConfirm(false);
    setRunning(true);
    setError('');
    try {
      const r = await api<{ results: Result[]; ms: number }>('/sql/run', { method: 'POST', body: { sql, allow_write: allowWrite } });
      setResults(r.results);
      setMs(r.ms);
      setRanSql(sql);
      remember(sql);
      // Si cambió la estructura, se refresca la lista de tablas.
      if (r.results.some((x) => /^(CREATE|ALTER|DROP)/.test(x.command))) loadTables();
    } catch (e) {
      setResults(null);
      setError(e instanceof ApiError ? e.message : 'No se pudo ejecutar.');
    } finally {
      setRunning(false);
    }
  }

  function moduleFromQuery() {
    try {
      sessionStorage.setItem(QUERY_HANDOFF_KEY, ranSql.trim().replace(/;\s*$/, ''));
    } catch {}
    navigate('/admin/modulos/nuevo?origen=consulta');
  }

  return (
    <>
      <PageHeader
        title="Consola SQL"
        icon="terminal"
        description="Consultas sobre el esquema datos de la base. Las tablas que crees aquí se pueden convertir en módulos del menú."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <Card className="p-4">
            <label htmlFor="sql" className="sr-only">
              Consulta SQL
            </label>
            <textarea
              id="sql"
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  run();
                }
              }}
              spellCheck={false}
              rows={10}
              className="w-full resize-y rounded-lg border border-border bg-muted/40 p-3 font-mono text-sm leading-relaxed focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => run()} disabled={running}>
                  <Icon name="terminal" /> {running ? 'Ejecutando…' : 'Ejecutar'}
                </Button>
                <span className="text-xs text-muted-foreground">Ctrl + Enter</span>
              </div>
              <Switch
                label="Permitir cambios"
                description={allowWrite ? 'Puede crear, modificar y borrar en datos.' : 'Solo lectura.'}
                checked={allowWrite}
                onCheckedChange={setAllowWrite}
              />
            </div>
          </Card>

          {error && (
            <Alert variant="error" title="Error">
              <span className="font-mono text-xs whitespace-pre-wrap">{error}</span>
            </Alert>
          )}

          {results && (
            <Card className="space-y-4 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">Ejecutado en {ms} ms</p>
                {isSelect(ranSql) && results.at(-1)?.columns.length ? (
                  <Button variant="outline" size="sm" onClick={moduleFromQuery}>
                    <Icon name="plus" /> Crear módulo con esta consulta
                  </Button>
                ) : null}
              </div>
              {results.map((r, i) => (
                <ResultView key={i} result={r} />
              ))}
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="p-4">
            <h2 className="mb-3 font-sans text-sm font-semibold">Tablas en datos</h2>
            {!tables ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : (
              <ul className="space-y-1">
                {tables.map((t) => (
                  <li key={t.name}>
                    <button
                      type="button"
                      onClick={() => setOpen(open === t.name ? null : t.name)}
                      aria-expanded={open === t.name}
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
                    {open === t.name && (
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
                          <Button size="sm" variant="ghost" onClick={() => setSql(`SELECT * FROM ${t.name} LIMIT 100`)}>
                            Ver filas
                          </Button>
                          {t.kind === 'tabla' && t.pk && (
                            <Button size="sm" variant="outline" onClick={() => navigate(`/admin/modulos/nuevo?tabla=${t.name}`)}>
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
                ))}
                {tables.length === 0 && <li className="text-sm text-muted-foreground">Aún no hay tablas.</li>}
              </ul>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 font-sans text-sm font-semibold">Ejemplos</h2>
            <ul className="space-y-1">
              {EXAMPLES.map((ex) => (
                <li key={ex.label}>
                  <button
                    type="button"
                    onClick={() => setSql(ex.sql)}
                    className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
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

          {history.length > 0 && (
            <Card className="p-4">
              <h2 className="mb-3 font-sans text-sm font-semibold">Historial</h2>
              <ul className="space-y-1">
                {history.slice(0, 8).map((h) => (
                  <li key={h}>
                    <button
                      type="button"
                      onClick={() => setSql(h)}
                      className="w-full truncate rounded-md px-2 py-1.5 text-left font-mono text-xs hover:bg-muted"
                      title={h}
                    >
                      {h.replace(/\s+/g, ' ')}
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>

      <Modal
        open={confirm}
        onOpenChange={setConfirm}
        title="¿Ejecutar una sentencia que borra datos?"
        description="La consulta contiene DROP, TRUNCATE o DELETE. Lo que se borre no se puede recuperar desde el panel."
        maxWidth="sm"
      >
        <Modal.Footer>
          <Button variant="outline" onClick={() => setConfirm(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => run(true)}>
            Ejecutar de todos modos
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
