// Tipos de AppearanceView.tsx y de sus tarjetas (BrandCard, ColorsCard, OwnColors, LoginCard, AppearancePreview).
import type { Appearance } from '@/features/admin/core/domain/schema';

export type Update = (patch: Partial<Appearance>) => void;

export interface PreviewProps {
  dark: boolean;
}

export interface BrandCardProps {
  draft: Appearance;
  update: Update;
  onLogo: (f: File) => void;
}

export interface OwnColorsProps {
  draft: Appearance;
  update: Update;
}

export interface ColorsCardProps {
  draft: Appearance;
  update: Update;
}

export interface LoginCardProps {
  draft: Appearance;
  update: Update;
  onImage: (f: File) => void;
  uploadingImage: boolean;
}
