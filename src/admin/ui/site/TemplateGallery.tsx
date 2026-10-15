// Galería de plantillas de Sitio web: una miniatura por plantilla (menú, franjas de los bloques, titular y botón).
import * as React from 'react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import type { TemplateCard } from '../lib/siteEditor';

function Thumbnail({ card, brand }: Readonly<{ card: TemplateCard; brand: string }>) {
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

interface TemplateGalleryProps {
  cards: TemplateCard[];
  brand: string;
  onApply: (id: string) => void;
}

export function TemplateGallery({ cards, brand, onApply }: Readonly<TemplateGalleryProps>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map((card) => (
        <article key={card.plantilla.id} className="flex flex-col gap-3 rounded-lg border border-border p-3">
          <Thumbnail card={card} brand={brand} />
          <div className="flex flex-1 flex-col gap-1">
            <h3 className="flex items-center gap-2 font-medium">
              {card.plantilla.nombre}
              {card.enUso && (
                <Badge variant="success" size="sm">
                  En uso
                </Badge>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">{card.plantilla.descripcion}</p>
          </div>
          <Button variant={card.enUso ? 'outline' : 'default'} disabled={card.enUso} onClick={() => onApply(card.plantilla.id)}>
            {card.enUso ? 'Aplicada' : 'Usar esta plantilla'}
          </Button>
        </article>
      ))}
    </div>
  );
}
