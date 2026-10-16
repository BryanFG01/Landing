// Tipos de TemplateGallery.tsx y de su miniatura (TemplateThumbnail.tsx).
import type { TemplateCard } from './lib/siteEditor';

export interface ThumbnailProps {
  card: TemplateCard;
  brand: string;
}

export interface TemplateGalleryProps {
  cards: TemplateCard[];
  brand: string;
  onApply: (id: string) => void;
}
