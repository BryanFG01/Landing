import { formatNumber } from '@/shared/lib/utils';
import type { StatTrend, TrendStyle } from './types';

/** Flecha, color y texto para lectores de pantalla de cada tendencia. */
export const TREND_STYLES: Record<StatTrend, TrendStyle> = {
  up: { icon: '↑', color: 'text-emerald-600 dark:text-emerald-400', srLabel: ' incremento' },
  down: { icon: '↓', color: 'text-red-500 dark:text-red-400', srLabel: ' disminución' },
  neutral: { icon: '→', color: 'text-muted-foreground', srLabel: '' },
};

/** Los números se formatean con separadores de miles salvo que se pida lo contrario. */
export function displayStatValue(value: number | string, formatValue: boolean): string {
  return typeof value === 'number' && formatValue ? formatNumber(value) : String(value);
}
