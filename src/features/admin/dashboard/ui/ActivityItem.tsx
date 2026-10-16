// Una línea de la actividad reciente del inicio: quién, qué, en qué módulo y cuándo.
import * as React from 'react';
import { activityActor, describeAction, formatDateTime } from '@/features/admin/core/ui/lib/format';
import type { ActivityItemProps } from './DashboardView.types';

export function ActivityItem({ activity: a }: Readonly<ActivityItemProps>) {
  return (
    <p className="px-4 py-3 text-sm">
      <span className="font-medium">{activityActor(a)}</span>{' '}
      <span className="text-muted-foreground">{describeAction(a.action)}</span>{' '}
      {a.module && <span className="font-medium">{a.module}</span>}
      <span className="block text-xs text-muted-foreground">{formatDateTime(a.created_at)}</span>
    </p>
  );
}
