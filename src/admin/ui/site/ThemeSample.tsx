// Muestra de los colores y tipografías del tema de la web, con sus avisos de contraste.
import * as React from 'react';
import { Alert } from '../../../components/ui/alert';
import type { Tema } from '../../../data/sitio';
import { fontStack } from '../lib/siteEditor';

export function ThemeSample({ tema: t, brand, warnings }: Readonly<{ tema: Tema; brand: string; warnings: string[] }>) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-4 rounded-lg p-5" style={{ background: t.fondo, color: t.texto }} aria-label="Muestra de colores">
        <span style={{ fontFamily: fontStack(t.titulos) }} className="text-2xl">
          {brand}
        </span>
        <span style={{ fontFamily: fontStack(t.cuerpo) }} className="text-sm opacity-80">
          Texto de ejemplo para leer
        </span>
        <span className="rounded-full px-4 py-2 text-sm font-medium" style={{ background: t.acento, color: t.fondo }}>
          Pedir por WhatsApp
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        La muestra usa las tipografías si tu navegador ya las tiene; la vista previa las muestra siempre.
      </p>
      {warnings.map((w) => (
        <Alert key={w} variant="warning">
          {w}
        </Alert>
      ))}
    </>
  );
}
