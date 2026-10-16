// Un bloque en la columna izquierda de Sitio web: abrirlo, moverlo y mostrarlo u ocultarlo.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { BLOCK_DEFS } from '@/features/landing/domain/sitio';
import { Icon } from '@/features/admin/core/ui/icons';
import { navItem } from './lib/siteSidebar';
import type { BlockRowProps } from './SiteSidebar.types';

export function BlockRow({ block: b, index: i, last, active, onSelect, onMove, onToggle }: Readonly<BlockRowProps>) {
  const isCover = i === 0;
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={onSelect} className={cn(navItem(active), 'min-w-0 flex-1', !b.visible && 'opacity-50')}>
        <span className="text-xs text-muted-foreground tabular-nums">{i + 1}</span>
        <span className="truncate">{BLOCK_DEFS[b.tipo].nombre}</span>
      </button>
      {!isCover && (
        <>
          <Button variant="ghost" size="icon" className="size-7" aria-label="Subir bloque" disabled={i <= 1} onClick={() => onMove(-1)}>
            <Icon name="arrow-up" className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7" aria-label="Bajar bloque" disabled={last} onClick={() => onMove(1)}>
            <Icon name="arrow-down" className="size-3.5" />
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label={b.visible ? 'Ocultar bloque' : 'Mostrar bloque'}
        title={b.visible ? 'Visible: clic para ocultar' : 'Oculto: clic para mostrar'}
        disabled={isCover}
        onClick={onToggle}
      >
        <Icon name={b.visible ? 'eye' : 'eye-slash'} className="size-3.5" />
      </Button>
    </div>
  );
}
