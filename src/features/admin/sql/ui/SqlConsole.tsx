// Consola SQL sobre el esquema "datos": crear tablas, cargar datos y probar consultas desde el navegador. Por defecto
// es de solo lectura; para modificar hay que activar "Permitir cambios" (y confirmar si borra algo).
// La lógica está en hooks/useSqlConsole.ts y lib/sql.ts.
import * as React from 'react';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Switch } from '@/shared/ui/switch';
import { ConfirmDialog } from '@/features/admin/core/ui/ConfirmDialog';
import { useSqlConsole } from './hooks/useSqlConsole';
import { Icon } from '@/features/admin/core/ui/icons';
import { PageHeader } from '@/features/admin/core/ui/PageHeader';
import { ResultView } from './ResultView';
import { ExamplesPanel, HistoryPanel, TablesPanel } from './SidePanels';

export function SqlConsole() {
  const sql = useSqlConsole();

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
              value={sql.sql}
              onChange={(e) => sql.setSql(e.target.value)}
              onKeyDown={sql.onEditorKeyDown}
              spellCheck={false}
              rows={10}
              className="w-full resize-y rounded-lg border border-border bg-muted/40 p-3 font-mono text-sm leading-relaxed focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => sql.run()} disabled={sql.running}>
                  <Icon name="terminal" /> {sql.running ? 'Ejecutando…' : 'Ejecutar'}
                </Button>
                <span className="text-xs text-muted-foreground">Ctrl + Enter</span>
              </div>
              <Switch
                label="Permitir cambios"
                description={sql.allowWrite ? 'Puede crear, modificar y borrar en datos.' : 'Solo lectura.'}
                checked={sql.allowWrite}
                onCheckedChange={sql.setAllowWrite}
              />
            </div>
          </Card>

          {sql.error && (
            <Alert variant="error" title="Error">
              <span className="font-mono text-xs whitespace-pre-wrap">{sql.error}</span>
            </Alert>
          )}

          {sql.results && (
            <Card className="space-y-4 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">Ejecutado en {sql.ms} ms</p>
                {sql.canCreateModule && (
                  <Button variant="outline" size="sm" onClick={sql.createModuleFromQuery}>
                    <Icon name="plus" /> Crear módulo con esta consulta
                  </Button>
                )}
              </div>
              {sql.results.map((r, i) => (
                // Los resultados van en el orden de las sentencias ejecutadas.
                // eslint-disable-next-line react/no-array-index-key
                <ResultView key={i} result={r} />
              ))}
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <TablesPanel tables={sql.tables} onQuery={sql.setSql} onCreateModule={sql.createModuleFromTable} />
          <ExamplesPanel onPick={sql.setSql} />
          <HistoryPanel history={sql.history} onPick={sql.setSql} />
        </aside>
      </div>

      <ConfirmDialog
        open={sql.confirming}
        title="¿Ejecutar una sentencia que borra datos?"
        description="La consulta contiene DROP, TRUNCATE o DELETE. Lo que se borre no se puede recuperar desde el panel."
        confirmLabel="Ejecutar de todos modos"
        destructive
        onConfirm={() => sql.run(true)}
        onCancel={sql.cancelConfirm}
      />
    </>
  );
}
