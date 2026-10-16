// Galería de plantillas de Sitio web: una miniatura por plantilla (menú, franjas de los bloques, titular y botón).
import * as React from 'react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import type { TemplateGalleryProps } from './TemplateGallery.types';
import { TemplateThumbnail as Thumbnail } from './TemplateThumbnail';

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
