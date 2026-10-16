import type * as React from 'react';

export type StatTrend = 'up' | 'down' | 'neutral';

/** Cómo se pinta una tendencia: flecha, color y texto oculto para lectores de pantalla. */
export interface TrendStyle {
  icon: string;
  color: string;
  srLabel: string;
}

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  trend?: StatTrend;
  icon?: React.ElementType<{ className?: string; 'aria-hidden'?: string }>;
  formatValue?: boolean;
}
