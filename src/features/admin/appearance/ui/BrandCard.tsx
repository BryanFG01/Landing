// Tarjeta de marca de la apariencia: logo, nombre y subtítulo del panel.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { FilePicker } from '@/features/admin/core/ui/FilePicker';
import type { BrandCardProps } from './AppearanceView.types';

export function BrandCard({ draft, update, onLogo }: Readonly<BrandCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Marca</CardTitle>
        <CardDescription>Se muestra en el menú lateral, en la pestaña del navegador y en el login.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <img
            src={draft.logo || '/icon-192.png'}
            alt="Logo actual"
            className="size-16 shrink-0 rounded-full border border-border bg-white object-contain"
          />
          <div className="flex flex-wrap gap-2">
            <FilePicker accept="image/png,image/jpeg,image/webp" label="Logo" onPick={onLogo}>
              Cambiar logo
            </FilePicker>
            {draft.logo && (
              <Button variant="ghost" size="sm" onClick={() => update({ logo: '' })}>
                Usar el de la web
              </Button>
            )}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre" value={draft.name} maxLength={40} onChange={(e) => update({ name: e.target.value })} />
          <Input label="Subtítulo" value={draft.subtitle} maxLength={40} onChange={(e) => update({ subtitle: e.target.value })} />
        </div>
      </CardContent>
    </Card>
  );
}
