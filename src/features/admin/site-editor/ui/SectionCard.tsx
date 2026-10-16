// Tarjeta de la sección abierta del editor de Sitio web: título, visibilidad del bloque, avisos y su formulario
// (o la galería de plantillas). Las decisiones llegan ya resueltas desde useSiteEditor.
import * as React from 'react';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Switch } from '@/shared/ui/switch';
import { Fields } from './Fields';
import { sectionKey } from './lib/siteEditor';
import type { SectionCardProps } from './SiteEditor.types';
import { TemplateGallery } from './TemplateGallery';
import { ThemeSample } from './ThemeSample';

export function SectionCard({ site, content, view, section }: Readonly<SectionCardProps>) {
  const { block } = site;
  return (
    <Card className="min-w-0 space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl">{view.title}</h2>
          <p className="text-sm text-muted-foreground">{view.description}</p>
        </div>
        {block && (
          <Switch
            label="Visible"
            description={site.isCoverBlock ? 'La portada siempre se muestra: lleva el titular principal.' : undefined}
            checked={block.visible}
            disabled={site.isCoverBlock}
            onCheckedChange={() => site.toggleBlock(block.tipo)}
          />
        )}
      </div>

      {site.isThemeSection ? (
        <>
          {site.ownColorBlocks.length > 0 && (
            <Alert variant="info" title="Algunos bloques tienen sus propios colores">
              <p>
                {site.ownColorBlocks.join(', ')}: no cambian con estos colores (los puso la plantilla o se eligieron en
                cada bloque, en "Colores del bloque").
              </p>
              <Button className="mt-3" size="sm" variant="outline" onClick={site.clearBlockColors}>
                Usar los colores de la página en todos los bloques
              </Button>
            </Alert>
          )}
          <ThemeSample tema={content.tema} brand={content.marca.nombre} warnings={site.warnings} />
        </>
      ) : (
        site.warnings.map((w) => (
          <Alert key={w} variant="warning">
            {w}
          </Alert>
        ))
      )}

      {site.isTemplatesSection ? (
        <TemplateGallery cards={site.templates} brand={content.marca.nombre} onApply={site.askTemplate} />
      ) : (
        <Fields key={sectionKey(section)} fields={view.fields} value={view.value} onChange={site.updateSection} />
      )}
    </Card>
  );
}
