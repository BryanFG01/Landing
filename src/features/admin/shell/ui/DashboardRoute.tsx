// Ruta del inicio: carga el resumen antes de pintar el DashboardView.
import * as React from 'react';
import type { DashboardStats } from '@/features/admin/core/domain/schema';
import { useApiData } from '@/features/admin/core/ui/hooks/useApiData';
import { LoadError, PageSkeleton } from '@/features/admin/core/ui/PageStates';
import { DashboardView } from '@/features/admin/dashboard/ui/DashboardView';
import type { DashboardRouteProps } from './AdminApp.types';

export function DashboardRoute({ user }: Readonly<DashboardRouteProps>) {
  const { data, error, reload } = useApiData<{ stats: DashboardStats }>('/dashboard');
  if (error) return <LoadError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;
  return <DashboardView user={user} stats={data.stats} />;
}
