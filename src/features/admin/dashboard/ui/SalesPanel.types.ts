// Tipos de SalesPanel.tsx y de sus partes (DailyChart, TopProducts, WebStats).
import type { SalesStats } from '@/features/admin/core/domain/sales';

export interface DailyChartProps {
  byDay: SalesStats['byDay'];
}

export interface TopProductsProps {
  top: SalesStats['top'];
}

export interface WebStatsProps {
  sales: SalesStats;
}

export interface SalesPanelProps {
  sales: SalesStats;
}
