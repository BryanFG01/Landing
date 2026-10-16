// Columna izquierda de Sitio web: ajustes generales, bloques en orden (mover, ocultar) y publicaciones anteriores.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { SETTINGS_DEFS } from '@/features/landing/domain/sitio';
import { Icon } from '@/features/admin/core/ui/icons';
import { formatDateTime } from '@/features/admin/core/ui/lib/format';
import { BlockRow } from './BlockRow';
import { isSection, SETTING_ICONS, TEMPLATES_SECTION, type Section } from './lib/siteEditor';
import { navItem } from './lib/siteSidebar';
import { SidebarHeading as Heading } from './SidebarHeading';
import type { SiteSidebarProps } from './SiteSidebar.types';

export function SiteSidebar({ blocks, versions, section, onSection, onMove, onToggle, onRestore }: Readonly<SiteSidebarProps>) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
      <Card className="p-3">
        <Heading>General</Heading>
        <button type="button" onClick={() => onSection(TEMPLATES_SECTION)} className={navItem(isSection(section, TEMPLATES_SECTION))}>
          <Icon name="swatches" />
          Plantillas
        </button>
        {SETTINGS_DEFS.map((s) => {
          const target: Section = { kind: 'setting', key: s.key };
          return (
            <button key={s.key} type="button" onClick={() => onSection(target)} className={navItem(isSection(section, target))}>
              <Icon name={SETTING_ICONS[s.key]} />
              {s.nombre}
            </button>
          );
        })}
      </Card>

      <Card className="p-3">
        <Heading>Bloques, en orden</Heading>
        {blocks.map((b, i) => {
          const target: Section = { kind: 'block', tipo: b.tipo };
          return (
            <BlockRow
              key={b.tipo}
              block={b}
              index={i}
              last={i === blocks.length - 1}
              active={isSection(section, target)}
              onSelect={() => onSection(target)}
              onMove={(delta) => onMove(i, delta)}
              onToggle={() => onToggle(b.tipo)}
            />
          );
        })}
        <p className="px-2 pt-2 text-xs text-muted-foreground">La portada va siempre primero.</p>
      </Card>

      <Card className="p-3">
        <Heading>Publicaciones</Heading>
        {versions.length ? (
          <ul className="space-y-1">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-2 px-2 py-1 text-xs">
                <span className="min-w-0">
                  <span className="block">{formatDateTime(v.published_at)}</span>
                  <span className="block truncate text-muted-foreground">{v.published_by ?? '—'}</span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => onRestore(v.id)}>
                  Recuperar
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-2 text-xs text-muted-foreground">Aún no se ha publicado desde el panel.</p>
        )}
      </Card>
    </aside>
  );
}
