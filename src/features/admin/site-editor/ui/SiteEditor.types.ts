// Tipos de SiteEditor.tsx y de sus partes (SectionCard, SiteEditorDialogs).
import type { SiteContent } from '@/features/landing/domain/sitio';
import type { useSiteEditor } from './hooks/useSiteEditor';
import type { Section, SectionView, SiteState } from './lib/siteEditor';

export type SiteEditorModel = ReturnType<typeof useSiteEditor>;

export interface SectionCardProps {
  site: SiteEditorModel;
  content: SiteContent;
  view: SectionView;
  section: Section;
}

export interface SiteEditorDialogsProps {
  site: SiteEditorModel;
  state: SiteState;
}
