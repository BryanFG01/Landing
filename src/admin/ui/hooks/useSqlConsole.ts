// Consola SQL: la consulta, su ejecución (con confirmación si borra datos), resultados e historial.
import * as React from 'react';
import { api, errorMessage } from '../api';
import {
  changesStructure,
  DEFAULT_SQL,
  handOffQuery,
  isDestructive,
  isSingleSelect,
  loadHistory,
  pushHistory,
  type SqlResult,
} from '../lib/sql';
import { useRouter } from '../router';
import { useTables } from './useTables';

export function useSqlConsole() {
  const { navigate } = useRouter();
  const tables = useTables();
  const [sql, setSql] = React.useState(() => loadHistory()[0] ?? DEFAULT_SQL);
  const [allowWrite, setAllowWrite] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [results, setResults] = React.useState<SqlResult[] | null>(null);
  const [ms, setMs] = React.useState(0);
  const [error, setError] = React.useState('');
  const [confirming, setConfirming] = React.useState(false);
  const [history, setHistory] = React.useState(loadHistory);
  const [ranSql, setRanSql] = React.useState('');

  async function run(force = false) {
    if (!sql.trim() || running) return;
    if (allowWrite && isDestructive(sql) && !force) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    setRunning(true);
    setError('');
    try {
      const r = await api<{ results: SqlResult[]; ms: number }>('/sql/run', { method: 'POST', body: { sql, allow_write: allowWrite } });
      setResults(r.results);
      setMs(r.ms);
      setRanSql(sql);
      setHistory((h) => pushHistory(h, sql));
      if (changesStructure(r.results)) void tables.reload();
    } catch (e) {
      setResults(null);
      setError(errorMessage(e, 'No se pudo ejecutar.'));
    } finally {
      setRunning(false);
    }
  }

  function createModuleFromQuery() {
    handOffQuery(ranSql);
    navigate('/admin/modulos/nuevo?origen=consulta');
  }

  return {
    sql,
    setSql,
    allowWrite,
    setAllowWrite,
    running,
    results,
    ms,
    error,
    confirming,
    cancelConfirm: () => setConfirming(false),
    history,
    tables: tables.tables,
    /** Lo último ejecutado fue un SELECT con columnas: se puede convertir en módulo. */
    canCreateModule: isSingleSelect(ranSql) && !!results?.at(-1)?.columns.length,
    run,
    createModuleFromQuery,
    createModuleFromTable: (name: string) => navigate(`/admin/modulos/nuevo?tabla=${name}`),
  };
}
