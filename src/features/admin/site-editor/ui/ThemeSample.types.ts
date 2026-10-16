// Tipos de ThemeSample.tsx.
import type { Tema } from '@/features/landing/domain/sitio';

export interface ThemeSampleProps {
  tema: Tema;
  brand: string;
  warnings: string[];
}
