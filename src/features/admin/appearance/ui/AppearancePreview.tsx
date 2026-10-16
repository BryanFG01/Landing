// Muestra de componentes con el tema actual, en claro o en oscuro.
import * as React from 'react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import type { PreviewProps } from './AppearanceView.types';

export function AppearancePreview({ dark }: Readonly<PreviewProps>) {
  return (
    <div className={dark ? 'dark' : 'light'}>
      <div className="space-y-3 rounded-lg border border-border bg-background p-4 text-foreground">
        <p className="text-xs font-medium text-muted-foreground">{dark ? 'Modo oscuro' : 'Modo claro'}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Guardar</Button>
          <Button size="sm" variant="outline">
            Cancelar
          </Button>
          <Badge>Activo</Badge>
        </div>
        <p className="text-sm">
          Texto con un <span className="text-primary underline underline-offset-4">enlace</span>.
        </p>
      </div>
    </div>
  );
}
