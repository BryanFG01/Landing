import type { Img } from '../domain/sitio';

export interface Props {
  img: Img;
  widths: number[];
  sizes: string;
  class?: string;
  pictureClass?: string;
  loading?: 'eager' | 'lazy';
  fetchpriority?: 'high' | 'low' | 'auto';
  alt?: string;
  style?: string;
}
