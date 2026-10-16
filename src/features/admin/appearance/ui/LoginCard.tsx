// Tarjeta del login de la apariencia: foto y textos de la pantalla de entrada.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { FilePicker } from '@/features/admin/core/ui/FilePicker';
import type { LoginCardProps } from './AppearanceView.types';

export function LoginCard({ draft, update, onImage, uploadingImage }: Readonly<LoginCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Login</CardTitle>
        <CardDescription>Foto y textos de la pantalla de entrada (los textos se ven en escritorio).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          {draft.login_image ? (
            <img
              src={draft.login_image}
              alt="Foto actual del login"
              className="h-16 w-24 shrink-0 rounded-md border border-border object-cover"
            />
          ) : (
            <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md border border-dashed border-border px-2 text-center text-xs text-muted-foreground">
              Foto de siempre
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <FilePicker accept="image/png,image/jpeg,image/webp" label="Foto del login" onPick={onImage} disabled={uploadingImage}>
              {uploadingImage ? 'Subiendo…' : 'Cambiar foto'}
            </FilePicker>
            {draft.login_image && (
              <Button variant="ghost" size="sm" onClick={() => update({ login_image: '' })} disabled={uploadingImage}>
                Usar la de siempre
              </Button>
            )}
          </div>
        </div>
        <Input label="Título" value={draft.login_title} maxLength={60} onChange={(e) => update({ login_title: e.target.value })} />
        <Textarea
          label="Frase"
          rows={2}
          value={draft.login_text}
          maxLength={200}
          onChange={(e) => update({ login_text: e.target.value })}
        />
      </CardContent>
    </Card>
  );
}
