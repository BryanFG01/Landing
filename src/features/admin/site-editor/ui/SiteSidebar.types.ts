// Tipos de SiteSidebar.tsx y de sus partes (BlockRow, SidebarHeading).
import type { ReactNode } from 'react';
import type { Bloque } from '@/features/landing/domain/sitio';
import type { Section, SiteState } from './lib/siteEditor';

export interface HeadingProps {
  children: ReactNode;
}

export interface BlockRowProps {
  block: Bloque;
  index: number;
  last: boolean;
  active: boolean;
  onSelect: () => void;
  onMove: (delta: number) => void;
  onToggle: () => void;
}

export interface SiteSidebarProps {
  blocks: Bloque[];
  versions: SiteState['versions'];
  section: Section;
  onSection: (s: Section) => void;
  onMove: (index: number, delta: number) => void;
  onToggle: (tipo: Bloque['tipo']) => void;
  onRestore: (versionId: number) => void;
}
