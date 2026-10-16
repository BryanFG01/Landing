// Tablas y vistas del esquema datos (consola SQL y constructor de módulos). Con `enabled = false` no se piden.
import * as React from 'react';
import { api } from '../api';
import type { TableInfo } from '../lib/sql';

export function useTables(enabled = true) {
  const [tables, setTables] = React.useState<TableInfo[] | null>(null);

  const reload = React.useCallback(async () => {
    try {
      const r = await api<{ tables: TableInfo[] }>('/tables');
      setTables(r.tables);
      return r.tables;
    } catch {
      setTables([]);
      return [];
    }
  }, []);

  React.useEffect(() => {
    if (enabled && tables === null) void reload();
  }, [enabled, tables, reload]);

  return { tables, reload };
}
