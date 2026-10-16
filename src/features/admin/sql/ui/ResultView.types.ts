// Tipos de ResultView.tsx y de su celda (ResultCell.tsx).
import type { SqlResult } from '@/features/admin/core/ui/lib/sql';

export interface CellProps {
  value: unknown;
}

export interface ResultViewProps {
  result: SqlResult;
}
