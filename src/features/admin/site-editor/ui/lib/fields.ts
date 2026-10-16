// Decisiones del formulario genérico de secciones (sin React).
import type { FieldDef } from '@/features/landing/domain/sitio';
import type { GroupDef } from '../Fields.types';

/** Los grupos no son un campo: sus campos se pintan juntos y se guardan en el mismo objeto. */
export const isGroupField = (f: FieldDef): f is GroupDef => f.type === 'group';
