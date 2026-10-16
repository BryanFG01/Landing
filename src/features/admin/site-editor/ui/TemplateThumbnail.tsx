// Miniatura de una plantilla de Sitio web: menú, titular, texto y franjas de los bloques.
import * as React from 'react';
import type { ThumbnailProps } from './TemplateGallery.types';

export function TemplateThumbnail({ card, brand }: Readonly<ThumbnailProps>) {
  const p = card.preview;
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-md ring-1 ring-border" style={{ background: p.fondo, color: p.texto }}>
      <div className="flex items-center justify-between px-3 py-1.5 text-xs" style={p.menu}>
        <span>{brand}</span>
        <span className="px-2 py-0.5" style={{ ...p.boton, borderRadius: p.radioBoton }}>
          Pedir
        </span>
      </div>
      <div className="space-y-2 p-3">
        <p className="text-lg leading-tight" style={p.titulos}>
          Del campo a tu cocina
        </p>
        <p className="text-xs opacity-80" style={{ fontFamily: p.cuerpo }}>
          Texto de ejemplo para leer
        </p>
      </div>
      <div className="flex h-6">
        {card.franjas.map((f, i) => (
          // Franjas por posición: un bloque por franja, en el orden de la página.
          // eslint-disable-next-line react/no-array-index-key
          <span key={i} className="flex-1" style={{ background: f }} />
        ))}
      </div>
    </div>
  );
}
