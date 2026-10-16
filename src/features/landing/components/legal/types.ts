import type { LegalBlock } from '../../domain/sitio';

export interface LegalBlockProps {
  bloque: LegalBlock;
}

export interface LegalTextProps {
  bloque: Extract<LegalBlock, { html: string }>;
}

export interface LegalListProps {
  bloque: Extract<LegalBlock, { tipo: 'lista' }>;
}
