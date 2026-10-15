// Columna izquierda de Sitio web: ajustes generales, bloques en orden (mover, ocultar) y publicaciones anteriores.
import * as React from 'react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { cn } from '../../../components/lib/utils';
import { BLOCK_DEFS, SETTINGS_DEFS, type Bloque } from '../../../data/sitio';
import { Icon } from '../icons';
import { formatDateTime } from '../lib/format';
import { isSection, SETTING_ICONS, TEMPLATES_SECTION, type Section, type SiteState } from '../lib/siteEditor';

const navItem = (active: boolean) =>
  cn(
    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
    active ? 'bg-primary/10 font-medium text-primary' : 'hover:bg-muted',
  );

const Heading = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <p className="px-2 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{children}</p>
);

interface BlockRowProps {
  block: Bloque;
  index: number;
  last: boolean;
  active: boolean;
  onSelect: () => void;
  onMove: (delta: number) => void;
  onToggle: () => void;
}

function BlockRow({ block: b, index: i, last, active, onSelect, onMove, onToggle }: Readonly<BlockRowProps>) {
  const isCover = i === 0;
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={onSelect} className={cn(navItem(active), 'min-w-0 flex-1', !b.visible && 'opacity-50')}>
        <span className="text-xs text-muted-foreground tabular-nums">{i + 1}</span>
        <span className="truncate">{BLOCK_DEFS[b.tipo].nombre}</span>
      </button>
      {!isCover && (
        <>
          <Button variant="ghost" size="icon" className="size-7" aria-label="Subir bloque" disabled={i <= 1} onClick={() => onMove(-1)}>
            <Icon name="arrow-up" className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7" aria-label="Bajar bloque" disabled={last} onClick={() => onMove(1)}>
            <Icon name="arrow-down" className="size-3.5" />
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label={b.visible ? 'Ocultar bloque' : 'Mostrar bloque'}
        title={b.visible ? 'Visible: clic para ocultar' : 'Oculto: clic para mostrar'}
        disabled={isCover}
        onClick={onToggle}
      >
        <Icon name={b.visible ? 'eye' : 'eye-slash'} className="size-3.5" />
      </Button>
    </div>
  );
}

interface SiteSidebarProps {
  blocks: Bloque[];
  versions: SiteState['versions'];
  section: Section;
  onSection: (s: Section) => void;
  onMove: (index: number, delta: number) => void;
  onToggle: (tipo: Bloque['tipo']) => void;
  onRestore: (versionId: number) => void;
}

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
