import type { icons } from './Icon.svgs';

/** Iconos disponibles: las claves de Icon.svgs.ts (añadir uno allí lo añade aquí). */
export type IconName = keyof typeof icons;

export interface Props {
  name: IconName;
  class?: string;
}
