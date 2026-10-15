// Muestra de los colores y tipografías del tema de la web, con sus avisos de contraste.
import * as React from 'react';
import { Alert } from '../../../components/ui/alert';
import type { Tema } from '../../../data/sitio';
import { themePreview } from '../lib/siteEditor';

export function ThemeSample({ tema, brand, warnings }: Readonly<{ tema: Tema; brand: string; warnings: string[] }>) {
  const p = themePreview(tema);
  return (
    <>
      <div className="overflow-hidden rounded-lg ring-1 ring-border" aria-label="Muestra de colores">
        <div className="px-5 py-2 text-xs" style={p.menu}>
          Menú · Inicio · Productos · Preguntas
        </div>
        <div className="flex flex-wrap items-center gap-4 p-5" style={{ background: p.fondo, color: p.texto }}>
          <span style={p.titulos} className="text-2xl">
            {brand}
          </span>
          <span style={{ fontFamily: p.cuerpo }} className="text-sm opacity-80">
            Texto de ejemplo para leer
          </span>
          <span className="px-4 py-2 text-sm font-medium" style={{ ...p.boton, borderRadius: p.radioBoton }}>
            Pedir por WhatsApp
          </span>
        </div>
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
