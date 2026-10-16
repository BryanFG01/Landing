// Marca del menú lateral: logo, nombre y subtítulo de la apariencia actual.
import * as React from 'react';
import { useAppearance } from '@/features/admin/core/ui/nav';

export function Brand() {
  const { appearance } = useAppearance();
  return (
    <a href="/admin" className="flex items-center gap-2.5">
      <img
        src={appearance.logo || '/icon-192.png'}
        alt=""
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-full bg-white object-contain"
      />
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-display text-base">{appearance.name}</span>
        {appearance.subtitle && (
          <span className="block truncate text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            {appearance.subtitle}
          </span>
        )}
      </span>
    </a>
  );
}
