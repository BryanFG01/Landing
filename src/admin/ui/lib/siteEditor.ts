// Editor de Sitio web: secciones, orden y visibilidad de bloques, avisos del tema y textos de estado (sin React).
import {
  BLOCK_DEFS,
  contrast,
  FONTS,
  SETTINGS_DEFS,
  type Bloque,
  type FieldDef,
  type FontKey,
  type Img,
  type SiteContent,
  type Tema,
} from '../../../data/sitio';
import { swap } from './lists';

export interface SiteState {
  content: SiteContent;
  unpublished: boolean;
  draft_updated_at: string | null;
  published_at: string | null;
  versions: { id: number; published_at: string; published_by: string | null }[];
  deploy_hook: boolean;
}

export type SettingKey = (typeof SETTINGS_DEFS)[number]['key'];
export type Section = { kind: 'setting'; key: SettingKey } | { kind: 'block'; tipo: Bloque['tipo'] };
export type DeployResult = 'ok' | 'sin_hook' | 'error';

export const FIRST_SECTION: Section = { kind: 'block', tipo: 'paseo' };

export const SETTING_ICONS: Record<SettingKey, string> = { tema: 'palette', marca: 'star', contacto: 'chat', seo: 'file' };

export const sectionKey = (s: Section) => (s.kind === 'block' ? s.tipo : s.key);
export const isSection = (a: Section, b: Section) => sectionKey(a) === sectionKey(b);

export interface SectionView {
  title: string;
  description: string;
  fields: FieldDef[];
  value: Record<string, unknown>;
  /** El contenido con los cambios de esta sección aplicados. */
  apply: (value: Record<string, unknown>) => SiteContent;
}

/** Lo que el editor muestra para la sección elegida (ajuste general o bloque). */
export function sectionView(content: SiteContent, section: Section): SectionView {
  if (section.kind === 'setting') {
    const def = SETTINGS_DEFS.find((s) => s.key === section.key)!;
    return {
      title: def.nombre,
      description: def.descripcion,
      fields: def.fields,
      value: content[section.key] as unknown as Record<string, unknown>,
      apply: (v) => ({ ...content, [section.key]: v }),
    };
  }
  const def = BLOCK_DEFS[section.tipo];
  const i = content.bloques.findIndex((b) => b.tipo === section.tipo);
  return {
    title: def.nombre,
    description: def.descripcion,
    fields: def.fields,
    value: content.bloques[i] as unknown as Record<string, unknown>,
    apply: (v) => ({ ...content, bloques: content.bloques.map((b, j) => (j === i ? { ...b, ...v } : b)) as Bloque[] }),
  };
}

/** Mueve un bloque. La portada (posición 0) no se mueve ni se puede adelantar: es el titular de la página. */
export function moveBlock(content: SiteContent, i: number, delta: number): SiteContent {
  if (i === 0 || i + delta < 1) return content;
  return { ...content, bloques: swap(content.bloques, i, delta) };
}

/** Muestra u oculta un bloque (la portada siempre se ve). */
export function toggleBlock(content: SiteContent, tipo: Bloque['tipo']): SiteContent {
  if (tipo === 'paseo') return content;
  return { ...content, bloques: content.bloques.map((b) => (b.tipo === tipo ? { ...b, visible: !b.visible } : b)) as Bloque[] };
}

/** Avisos de contraste del tema (WCAG): texto 4,5:1, acento sobre el fondo 3:1. */
export function themeWarnings(t: Tema): string[] {
  const warnings: string[] = [];
  if (contrast(t.texto, t.fondo) < 4.5) warnings.push('El texto y el fondo tienen poco contraste: costará leer.');
  if (contrast(t.acento, t.fondo) < 3) warnings.push('El acento casi no se distingue del fondo.');
  if (contrast(t.fondo, t.acento) < 4.5) warnings.push('El texto de los botones (color de fondo sobre acento) tiene poco contraste.');
  return warnings;
}

export const fontStack = (key: FontKey) => `var(${FONTS[key].css}), ${FONTS[key].fallback}`;

/** Tipografías que se ofrecen para títulos o para textos. */
export const fontOptions = (uso: 'titulos' | 'cuerpo') =>
  Object.entries(FONTS)
    .filter(([, font]) => font.uso === 'ambos' || font.uso === uso)
    .map(([value, font]) => ({ value, label: font.label }));

/** Video que ya viene con la web (los videos no se suben desde el panel). */
export const DEFAULT_VIDEO = '/video/pollos.mp4';

const EMPTY_IMG: Img = { src: '', alt: '' };
export const asImg = (v: unknown): Img => (v && typeof v === 'object' ? (v as Img) : EMPTY_IMG);
export const asText = (v: unknown) => (typeof v === 'string' ? v : '');
export const asLines = (v: unknown) => (Array.isArray(v) ? v.join('\n') : '');
export const asItems = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);

export function statusBadge(dirty: boolean, unpublished: boolean) {
  if (dirty) return 'Cambios sin guardar';
  return unpublished ? 'Borrador sin publicar' : 'Publicado';
}

export const PUBLISH_TOAST: Record<DeployResult, { variant: 'success' | 'warning' | 'error'; title: string }> = {
  ok: { variant: 'success', title: 'Publicado. La web se actualiza en 1 o 2 minutos.' },
  sin_hook: { variant: 'warning', title: 'Publicado. Se verá en el próximo despliegue (falta el Deploy Hook de Vercel).' },
  error: { variant: 'error', title: 'Publicado, pero Vercel no respondió. Vuelve a publicar en un momento.' },
};

// ─── Imágenes del contenido ──────────────────────────────────────────────────

// Miniaturas de las imágenes que vienen con el proyecto (en la web salen optimizadas por Astro).
const ASSET_PREVIEW: Record<string, string> = {
  'asset:logo': '/icon-192.png',
  'asset:amanecer': '/photos/0-amanecer.jpg',
  'asset:gallinas': '/photos/1-gallinas.jpg',
  'asset:nidos': '/photos/2-nidos.jpg',
  'asset:recogida': '/photos/3-recogida.jpg',
  'asset:seleccion': '/photos/5-seleccion.jpg',
  'asset:entrega': '/photos/6-entrega.jpg',
};

export const previewSrc = (img: Img) => (img.src.startsWith('asset:') ? ASSET_PREVIEW[img.src] : img.src);

export function imageOrigin(img: Img) {
  if (img.src.startsWith('asset:')) return 'Imagen original de la web';
  return img.src ? 'Imagen subida desde el panel' : 'Sin imagen';
}

/** Título de un elemento de una lista: su primer texto, o "Producto 3". */
export function itemTitle(fields: FieldDef[], item: Record<string, unknown>, label: string, index: number) {
  const first = fields.find((f) => f.type === 'text' || f.type === 'textarea');
  const text = first && typeof item[first.key] === 'string' ? (item[first.key] as string) : '';
  return text ? text.slice(0, 70) : `${label} ${index + 1}`;
}
