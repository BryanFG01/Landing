// Tipos de los paneles laterales de la consola (TableItem, TablesPanel, ExamplesPanel, HistoryPanel).
import type { TableInfo } from '@/features/admin/core/ui/lib/sql';

export interface TableItemProps {
  table: TableInfo;
  onQuery: (sql: string) => void;
  onCreateModule: (name: string) => void;
}

export interface TablesPanelProps {
  tables: TableInfo[] | null;
  onQuery: (sql: string) => void;
  onCreateModule: (name: string) => void;
}

export interface ExamplesPanelProps {
  onPick: (sql: string) => void;
}

export interface HistoryPanelProps {
  history: string[];
  onPick: (sql: string) => void;
}
