// Tipos de icons.tsx.
import type { SVG } from './icons';

export type IconKey = keyof typeof SVG;

export interface IconProps {
  name: string | null | undefined;
  className?: string;
}

export interface SidebarIconProps {
  className?: string;
}
