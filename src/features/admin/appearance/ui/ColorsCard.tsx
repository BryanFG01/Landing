// Tarjeta de colores y forma: de dónde salen los colores del panel y el tema por defecto.
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Select } from '@/shared/ui/select';
import type { Appearance } from '@/features/admin/core/domain/schema';
import type { ColorsCardProps } from './AppearanceView.types';
import { COLOR_SOURCE_OPTIONS, THEME_OPTIONS, usesWebColors } from './lib/appearance';
import { OwnColors } from './OwnColors';

export function ColorsCard({ draft, update }: Readonly<ColorsCardProps>) {
  const fromWeb = usesWebColors(draft);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Colores y forma</CardTitle>
        <CardDescription>
          {fromWeb
            ? 'El panel usa los colores, esquinas y tipografías de la plantilla publicada en Sitio web. Al publicar otra plantilla, el panel cambia con ella.'
            : 'El color principal se usa en botones, enlaces y el elemento activo del menú. El color del texto encima se elige solo para que se lea bien.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Colores del panel"
            options={COLOR_SOURCE_OPTIONS}
            value={draft.colores}
            onValueChange={(v) => update({ colores: v as Appearance['colores'] })}
          />
          {!fromWeb && <OwnColors draft={draft} update={update} />}
          <Select
            label="Tema por defecto"
            options={THEME_OPTIONS}
            value={draft.theme}
            onValueChange={(v) => update({ theme: v as Appearance['theme'] })}
          />
        </div>
        <p className="text-xs text-muted-foreground">El tema por defecto se aplica a quien no haya elegido uno con el botón de sol/luna.</p>
      </CardContent>
    </Card>
  );
}
