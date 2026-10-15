// Cabecera de cada página del panel: icono, título, etiqueta opcional, descripción y acciones.
import * as React from 'react';
import { Badge } from '../../components/ui/badge';
import { Icon } from './icons';

interface PageHeaderProps {
  title: string;
  description?: string | null;
  icon?: string | null;
  badge?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, icon, badge, actions }: Readonly<PageHeaderProps>) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon name={icon} className="size-5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl leading-tight">
            {title}
            {badge && (
              <Badge variant="muted" size="sm" className="font-sans">
                {badge}
              </Badge>
            )}
          </h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
