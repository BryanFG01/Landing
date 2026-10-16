// Opciones y decisiones de la pantalla de apariencia (sin React).
import type { Appearance } from '@/features/admin/core/domain/schema';

export const COLOR_SOURCE_OPTIONS = [
  { value: 'web', label: 'Los de la plantilla de la web' },
  { value: 'propios', label: 'Propios del panel' },
];

export const THEME_OPTIONS = [
  { value: 'auto', label: 'El del sistema de cada persona' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

/** El panel toma los colores de la plantilla publicada de la web en vez de los propios. */
export const usesWebColors = (draft: Appearance) => draft.colores === 'web';
