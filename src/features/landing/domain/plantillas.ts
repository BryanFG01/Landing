// Plantillas de diseño de la landing: un tema completo (colores, botones, menú, pie, esquinas y tipografías) y los
// colores de cada bloque. Aplicar una cambia solo el aspecto: los textos, fotos, orden y visibilidad se quedan.
//
// Las referencias de estilo de cada una están en .claude/skills/plantilla-<id>/SKILL.md. Los tonos se ajustaron para
// que texto y botones cumplan el contraste mínimo (WCAG), que el editor también revisa.

import {
  SITE_DEFAULTS,
  type Bloque,
  type ColoresBloque,
  type DisenioPortada,
  type SiteContent,
  type Tema,
  type TipoBloque,
} from './sitio';

export interface Plantilla {
  id: string;
  nombre: string;
  descripcion: string;
  /** Disposición de la portada (bloque "paseo"). */
  portada: DisenioPortada;
  tema: Tema;
  /** Colores propios por tipo de bloque. Los bloques que no aparecen usan los de la página. */
  bloques: Partial<Record<TipoBloque, ColoresBloque>>;
}

const SIN_COLORES: Required<ColoresBloque> = { colorFondo: '', colorFondo2: '', colorTexto: '', colorAcento: '' };

export const PLANTILLAS: Plantilla[] = [
  {
    id: 'original',
    nombre: 'Finca',
    descripcion: 'La de siempre: verde finca, crema y teja, con títulos de estilo editorial. Portada dividida: texto y video lado a lado.',
    portada: 'dividida',
    tema: SITE_DEFAULTS.tema,
    bloques: {},
  },
  {
    id: 'orbita',
    nombre: 'Órbita',
    descripcion:
      'Azul cielo con paneles azul marino y botones naranja en degradado. Títulos redondeados y gruesos. Portada en un gran panel redondeado.',
    portada: 'panel',
    tema: {
      fondo: '#e1f2ff',
      texto: '#183d6d',
      acento: '#c2410c',
      textoBoton: '#ffffff',
      acento2: '#e8622f',
      degradado: '#ffa84a',
      menuFondo: '#051e38',
      menuTexto: '#ffffff',
      menuPosicion: 'izquierda',
      pieFondo: '#eff8ff',
      pieTexto: '#183d6d',
      titulos: 'rubik',
      cuerpo: 'rubik',
      pesoTitulos: '700',
      botones: 'suaves',
      tarjetas: 'suaves',
    },
    bloques: {
      paseo: { colorFondo: '#051e38', colorTexto: '#ffffff', colorAcento: '#fd8d32' },
      diferencia: { colorFondo: '#022e57', colorTexto: '#ffffff', colorAcento: '#fd8d32' },
      opiniones: { colorFondo: '#eff8ff' },
      semanal: { colorFondo: '#ffffff' },
      final: { colorFondo: '#051e38', colorTexto: '#ffffff', colorAcento: '#fd8d32' },
    },
  },
  {
    id: 'atardecer',
    nombre: 'Atardecer',
    descripcion:
      'Blanco con tinta berenjena, un acento fucsia y una franja con degradado de atardecer (rosa a amarillo). Portada centrada sobre el video.',
    portada: 'centrada',
    tema: {
      fondo: '#ffffff',
      texto: '#240029',
      acento: '#c4268e',
      textoBoton: '#ffffff',
      acento2: '',
      degradado: '#ffbdd3',
      menuFondo: '#ffffff',
      menuTexto: '#240029',
      // Portada centrada: el menú también.
      menuPosicion: 'centro',
      pieFondo: '#240029',
      pieTexto: '#ffffff',
      titulos: 'intertight',
      cuerpo: 'intertight',
      pesoTitulos: '700',
      botones: 'suaves',
      tarjetas: 'medias',
    },
    bloques: {
      paseo: { colorFondo: '#240029', colorTexto: '#ffffff', colorAcento: '#ff5cc8' },
      frase: { colorFondo: '#ffbdd3', colorFondo2: '#ffcb0f', colorTexto: '#240029' },
      semanal: { colorFondo: '#fff1bd' },
      final: { colorFondo: '#240029', colorTexto: '#ffffff', colorAcento: '#ff5cc8' },
    },
  },
  {
    id: 'lima',
    nombre: 'Lima',
    descripcion:
      'Blanco cálido y verde bosque, con el verde lima solo en las franjas oscuras. Títulos finos y tarjetas rectas. Portada clara con el video en una tarjeta.',
    portada: 'tarjeta',
    tema: {
      fondo: '#ffffff',
      texto: '#11110d',
      acento: '#2d4c33',
      textoBoton: '#ffffff',
      acento2: '',
      degradado: '#2d4c33',
      menuFondo: '#ffffff',
      menuTexto: '#11110d',
      menuPosicion: 'izquierda',
      pieFondo: '#f5f5f2',
      pieTexto: '#11110d',
      titulos: 'dmsans',
      cuerpo: 'dmsans',
      pesoTitulos: '300',
      botones: 'redondeados',
      tarjetas: 'rectas',
    },
    bloques: {
      paseo: { colorFondo: '#f5f5f2' },
      frase: { colorFondo: '#203524', colorTexto: '#ffffff', colorAcento: '#d1f470' },
      diferencia: { colorFondo: '#203524', colorTexto: '#ffffff', colorAcento: '#d1f470' },
      opiniones: { colorFondo: '#f5f5f2' },
      semanal: { colorFondo: '#2d4c33', colorTexto: '#ffffff', colorAcento: '#d1f470' },
      final: { colorFondo: '#203524', colorTexto: '#ffffff', colorAcento: '#d1f470' },
    },
  },
];

const coloresDe = (b: ColoresBloque): Required<ColoresBloque> => ({
  colorFondo: b.colorFondo ?? '',
  colorFondo2: b.colorFondo2 ?? '',
  colorTexto: b.colorTexto ?? '',
  colorAcento: b.colorAcento ?? '',
});

/** El contenido con el aspecto de la plantilla. Los textos, fotos, orden y visibilidad no cambian. */
export function aplicarPlantilla(site: SiteContent, p: Plantilla): SiteContent {
  return {
    ...site,
    tema: { ...p.tema },
    bloques: site.bloques.map((b) => ({
      ...b,
      ...SIN_COLORES,
      ...p.bloques[b.tipo],
      ...(b.tipo === 'paseo' ? { disenio: p.portada } : {}),
    })) as Bloque[],
  };
}

const mismoTema = (a: Tema, b: Tema) => (Object.keys(a) as (keyof Tema)[]).every((k) => a[k] === b[k]);
const mismosColores = (a: ColoresBloque, b: ColoresBloque) => {
  const [x, y] = [coloresDe(a), coloresDe(b)];
  return (Object.keys(x) as (keyof ColoresBloque)[]).every((k) => x[k] === y[k]);
};

/** La plantilla que coincide exactamente con el aspecto actual (null si se retocó a mano). */
export function plantillaEnUso(site: SiteContent): string | null {
  const portada = site.bloques.find((b) => b.tipo === 'paseo')?.disenio;
  const p = PLANTILLAS.find(
    (p) =>
      p.portada === portada &&
      mismoTema(p.tema, site.tema) &&
      site.bloques.every((b) => mismosColores(b, p.bloques[b.tipo] ?? {})),
  );
  return p?.id ?? null;
}
