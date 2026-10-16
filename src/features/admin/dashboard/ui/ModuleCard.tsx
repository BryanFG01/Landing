// Acceso rápido a un módulo en el inicio, con su contador de registros.
import * as React from 'react';
import { Card } from '@/shared/ui/card';
import { Icon } from '@/features/admin/core/ui/icons';
import { recordsLabel } from '@/features/admin/core/ui/lib/format';
import type { ModuleCardProps } from './DashboardView.types';

export function ModuleCard({ module: m }: Readonly<ModuleCardProps>) {
  return (
    <a href={`/admin/m/${m.module_key}`} className="group">
      <Card className="flex h-full items-start gap-3 p-4 transition-colors group-hover:border-primary/40">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon name={m.icon} className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block font-medium">{m.name}</span>
          <span className="block text-sm text-muted-foreground">{recordsLabel(m.records, m.source_type)}</span>
        </span>
      </Card>
    </a>
  );
}
