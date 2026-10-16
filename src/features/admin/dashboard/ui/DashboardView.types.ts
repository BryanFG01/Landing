// Tipos de DashboardView.tsx y de sus partes (ModuleCard, NoModules, ActivityItem).
import type { AdminUser, DashboardStats } from '@/features/admin/core/domain/schema';

export type ModuleSummary = DashboardStats['modules'][number];
export type Activity = DashboardStats['recent'][number];

export interface ModuleCardProps {
  module: ModuleSummary;
}

export interface NoModulesProps {
  isAdmin: boolean;
}

export interface ActivityItemProps {
  activity: Activity;
}

export interface DashboardViewProps {
  user: AdminUser;
  stats: DashboardStats;
}
