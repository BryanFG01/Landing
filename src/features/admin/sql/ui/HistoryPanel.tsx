// Panel lateral de la consola: últimas consultas ejecutadas en este navegador.
import * as React from 'react';
import { Card } from '@/shared/ui/card';
import { oneLine } from '@/features/admin/core/ui/lib/sql';
import type { HistoryPanelProps } from './SidePanels.types';

const HISTORY_SHOWN = 8;

export function HistoryPanel({ history, onPick }: Readonly<HistoryPanelProps>) {
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
