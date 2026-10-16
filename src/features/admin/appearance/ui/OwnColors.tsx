// Colores propios del panel (cuando no se usan los de la web): principal, modo oscuro y esquinas.
import * as React from 'react';
import { Select } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { RADIUS_OPTIONS } from '@/features/admin/core/domain/schema';
import { ColorField } from '@/features/admin/core/ui/ColorField';
import type { OwnColorsProps } from './AppearanceView.types';

export function OwnColors({ draft, update }: Readonly<OwnColorsProps>) {
  return (
    <>
      <ColorField label="Color principal" value={draft.primary} onChange={(primary) => update({ primary })} />
      <div className="space-y-2">
        {draft.primary_dark ? (
          <ColorField label="Color en modo oscuro" value={draft.primary_dark} onChange={(primary_dark) => update({ primary_dark })} />
        ) : (
          <p className="pt-1 text-sm font-medium">Color en modo oscuro</p>
        )}
        <Switch
          label="Automático"
          description="Una versión más clara del color principal."
          checked={!draft.primary_dark}
          onCheckedChange={(auto) => update({ primary_dark: auto ? '' : draft.primary })}
        />
      </div>
      <Select label="Esquinas" options={RADIUS_OPTIONS} value={String(draft.radius)} onValueChange={(v) => update({ radius: Number(v) })} />
    </>
  );
}
