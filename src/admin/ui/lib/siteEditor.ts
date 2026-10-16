// Editor de Sitio web: secciones, orden y visibilidad de bloques, avisos del tema y textos de estado (sin React).
import type { PanelSiteTheme } from '../../schema';
import { PLANTILLAS, plantillaEnUso, type Plantilla } from '../../../data/plantillas';
import {
  BLOCK_DEFS,
  contrast,
  ESQUINAS_BOTONES,
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
export type Section = { kind: 'templates' } | { kind: 'setting'; key: SettingKey } | { kind: 'block'; tipo: Bloque['tipo'] };
export type DeployResult = 'ok' | 'sin_hook' | 'error';

export const FIRST_SECTION: Section = { kind: 'block', tipo: 'paseo' };
export const TEMPLATES_SECTION: Section = { kind: 'templates' };

export const SETTING_ICONS: Record<SettingKey, string> = {
  tema: 'palette',
  marca: 'star',
  contacto: 'map-pin',
  seo: 'file',
  chat: 'chat',
  legal: 'lock',
};

export function sectionKey(s: Section) {
  if (s.kind === 'templates') return 'plantillas';
  return s.kind === 'block' ? s.tipo : s.key;
}
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
  if (section.kind === 'templates') {
    return {
      title: 'Plantillas',
      description:
        'Cambia de una vez los colores, botones, menú, pie, esquinas y tipografías. Tus textos, fotos y el orden de los bloques no cambian. Después puedes retocar cualquier color.',
      fields: [],
      value: {},
      apply: () => content,
    };
  }
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

const hasOwnColors = (b: Bloque) => !!(b.colorFondo || b.colorFondo2 || b.colorTexto || b.colorAcento);

/** Nombres de los bloques con colores propios: no cambian al tocar los colores de la página. */
export const blocksWithOwnColors = (content: SiteContent) =>
  content.bloques.filter(hasOwnColors).map((b) => BLOCK_DEFS[b.tipo].nombre);

/** Todos los bloques pasan a usar los colores de la página (el diseño de la portada no cambia). */
export const clearBlockColors = (content: SiteContent): SiteContent => ({
  ...content,
  bloques: content.bloques.map((b) => ({ ...b, colorFondo: '', colorFondo2: '', colorTexto: '', colorAcento: '' })),
});

/** Avisos de contraste del tema (WCAG): texto 4,5:1, acento sobre el fondo 3:1. */
export function themeWarnings(t: Tema): string[] {
  const warnings: string[] = [];
  if (contrast(t.texto, t.fondo) < 4.5) warnings.push('El texto y el fondo tienen poco contraste: costará leer.');
  if (contrast(t.acento, t.fondo) < 3) warnings.push('El acento casi no se distingue del fondo.');
  if (contrast(t.textoBoton, t.acento) < 4.5) warnings.push('El texto de los botones tiene poco contraste con el acento.');
  if (t.menuFondo && contrast(t.menuTexto || t.texto, t.menuFondo) < 4.5) warnings.push('El texto del menú se lee mal sobre su fondo.');
  if (t.pieFondo && contrast(t.pieTexto || t.texto, t.pieFondo) < 4.5) warnings.push('El texto del pie de página se lee mal sobre su fondo.');
  return warnings;
}

/** Avisos de contraste de un bloque con colores propios (con los del tema donde no tiene). */
export function blockWarnings(b: Bloque, t: Tema): string[] {
  const fondo = b.colorFondo || t.fondo;
  const texto = b.colorTexto || t.texto;
  const acento = b.colorAcento || t.acento;
  const warnings: string[] = [];
  if (contrast(texto, fondo) < 4.5) warnings.push('El texto y el fondo de este bloque tienen poco contraste: costará leer.');
  if (b.colorFondo2 && contrast(texto, b.colorFondo2) < 4.5) warnings.push('El texto se lee mal sobre el segundo color del fondo.');
  if (contrast(acento, fondo) < 3) warnings.push('El acento casi no se distingue del fondo de este bloque.');
  return warnings;
}

/** Avisos de la sección abierta: los del tema o los del bloque. */
export function sectionWarnings(content: SiteContent, section: Section): string[] {
  if (section.kind === 'setting' && section.key === 'tema') return themeWarnings(content.tema);
  if (section.kind !== 'block') return [];
  const b = content.bloques.find((x) => x.tipo === section.tipo);
  return b ? blockWarnings(b, content.tema) : [];
}

/** Lo que el panel toma del tema de la web (sus colores, esquinas y tipografías). */
export const panelThemeOf = (t: Tema): PanelSiteTheme => ({
  fondo: t.fondo,
  texto: t.texto,
  acento: t.acento,
  titulos: t.titulos,
  cuerpo: t.cuerpo,
  pesoTitulos: t.pesoTitulos,
  tarjetas: t.tarjetas,
});

export const fontStack = (key: FontKey) => `var(${FONTS[key].css}), ${FONTS[key].fallback}`;

/** Lo que pinta la miniatura de un tema (editor y tarjetas de plantillas). */
export function themePreview(t: Tema) {
  return {
    fondo: t.fondo,
    texto: t.texto,
    boton: { background: t.acento2 ? `linear-gradient(180deg, ${t.acento}, ${t.acento2})` : t.acento, color: t.textoBoton },
    radioBoton: ESQUINAS_BOTONES[t.botones].radio,
    menu: { background: t.menuFondo || t.fondo, color: t.menuTexto || t.texto },
    titulos: { fontFamily: fontStack(t.titulos), fontWeight: Number(t.pesoTitulos) },
    cuerpo: fontStack(t.cuerpo),
  };
}

export interface TemplateCard {
  plantilla: Plantilla;
  enUso: boolean;
  preview: ReturnType<typeof themePreview>;
  /** Fondo de cada bloque visible, en orden (franjas de la miniatura). */
  franjas: string[];
}

function franja(p: Plantilla, b: Bloque) {
  const c = p.bloques[b.tipo];
  if (!c?.colorFondo) return p.tema.fondo;
  return c.colorFondo2 ? `linear-gradient(90deg, ${c.colorFondo}, ${c.colorFondo2})` : c.colorFondo;
}

/** Tarjetas de la galería de plantillas, con la que está en uso marcada. */
export function templateCards(content: SiteContent): TemplateCard[] {
  const enUso = plantillaEnUso(content);
  const visibles = content.bloques.filter((b) => b.visible);
  return PLANTILLAS.map((p) => ({
    plantilla: p,
    enUso: p.id === enUso,
    preview: themePreview(p.tema),
    franjas: visibles.map((b) => franja(p, b)),
  }));
}

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
