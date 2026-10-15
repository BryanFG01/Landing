// Contenido editable de la landing: tema (colores y tipografías), marca, contacto, SEO y bloques en orden.
//
// Lo comparten la landing (que lo lee al construirse) y el editor "Sitio web" del panel (que lo dibuja a partir de
// BLOCK_DEFS y SETTINGS_DEFS). No importa nada de Astro: las imágenes del proyecto se nombran con "asset:<clave>" y
// las resuelve src/data/assets.ts. Las subidas desde el panel son "/media/<id>".
//
// SITE_DEFAULTS es la landing tal como está hecha. Mientras nadie publique nada desde el panel, se ve exactamente esto.

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type Img = { src: string; alt: string };

export const FONTS = {
  hina: { label: 'Hina Mincho (actual)', css: '--font-hina', fallback: 'serif', uso: 'titulos' },
  playfair: { label: 'Playfair Display', css: '--font-playfair', fallback: 'serif', uso: 'titulos' },
  fraunces: { label: 'Fraunces', css: '--font-fraunces', fallback: 'serif', uso: 'titulos' },
  dmserif: { label: 'DM Serif Display', css: '--font-dmserif', fallback: 'serif', uso: 'titulos' },
  lora: { label: 'Lora', css: '--font-lora', fallback: 'serif', uso: 'ambos' },
  zen: { label: 'Zen Kaku Gothic New (actual)', css: '--font-zen', fallback: 'sans-serif', uso: 'ambos' },
  manrope: { label: 'Manrope', css: '--font-manrope', fallback: 'sans-serif', uso: 'ambos' },
  poppins: { label: 'Poppins', css: '--font-poppins', fallback: 'sans-serif', uso: 'ambos' },
  nunito: { label: 'Nunito Sans', css: '--font-nunito', fallback: 'sans-serif', uso: 'ambos' },
} as const;

export type FontKey = keyof typeof FONTS;

export interface Tema {
  fondo: string;
  texto: string;
  acento: string;
  titulos: FontKey;
  cuerpo: FontKey;
}

export interface Marca {
  nombre: string;
  lema: string;
  promesa: string;
  /** Frase del pie de página. */
  pie: string;
  logo: Img;
}

export interface Contacto {
  /** Número de WhatsApp con indicativo, solo dígitos. */
  whatsapp: string;
  telefono: string;
  ubicacion: string;
  zonaEntrega: string;
  horario: string;
  entregas: string;
  pagos: string;
  instagram: string;
  instagramUrl: string;
  /** Mensaje con el que se abre WhatsApp al pulsar "Pedir". {marca} se cambia por el nombre. */
  mensajePedido: string;
}

export interface Seo {
  titulo: string;
  descripcion: string;
}

export type Item = { valor: string; etiqueta: string };

export const STOP_STYLES = {
  texto: 'Solo texto',
  chips: 'Etiquetas (píldoras)',
  cifras: 'Cifras grandes',
  tarjetas: 'Tarjetas',
  numero: 'Un número destacado',
  pasos: 'Pasos numerados',
} as const;

export const STOP_BUTTONS = {
  ninguno: 'Sin botón',
  whatsapp: 'Pedir por WhatsApp',
  productos: 'Enlace a Productos',
} as const;

export interface Parada {
  lugar: string;
  eyebrow: string;
  titulo: string;
  texto: string;
  nota: string;
  estilo: keyof typeof STOP_STYLES;
  items: Item[];
  boton: keyof typeof STOP_BUTTONS;
}

interface Base {
  /** Identificador estable del bloque (no cambia al reordenar). */
  id: string;
  visible: boolean;
}

export interface BloquePaseo extends Base {
  tipo: 'paseo';
  video: string;
  poster: Img;
  pista: string;
  paradas: Parada[];
}
export interface BloqueFrase extends Base {
  tipo: 'frase';
  lineas: string[];
}
export interface BloqueProductos extends Base {
  tipo: 'productos';
  eyebrow: string;
  titulo: string;
  nota: string;
  items: { nombre: string; detalle: string; precio: string; foto: Img }[];
}
export interface BloqueDiferencia extends Base {
  tipo: 'diferencia';
  eyebrow: string;
  titulo: string;
  texto: string;
  nombreOtro: string;
  filas: { nuestro: string; otro: string }[];
  video: string;
  poster: Img;
  eyebrow2: string;
  titulo2: string;
  pasos: { titulo: string; texto: string }[];
}
export interface BloqueOpiniones extends Base {
  tipo: 'opiniones';
  eyebrow: string;
  titulo: string;
  items: { texto: string; autor: string }[];
}
export interface BloquePreguntas extends Base {
  tipo: 'preguntas';
  eyebrow: string;
  titulo: string;
  texto: string;
  items: { pregunta: string; respuesta: string }[];
}
export interface BloqueSemanal extends Base {
  tipo: 'semanal';
  eyebrow: string;
  titulo: string;
  texto: string;
  boton: string;
  mensaje: string;
  imagen: Img;
}
export interface BloqueFinal extends Base {
  tipo: 'final';
  titulo: string;
  texto: string;
  boton: string;
}

export type Bloque =
  | BloquePaseo
  | BloqueFrase
  | BloqueProductos
  | BloqueDiferencia
  | BloqueOpiniones
  | BloquePreguntas
  | BloqueSemanal
  | BloqueFinal;

export type TipoBloque = Bloque['tipo'];

export interface SiteContent {
  version: 1;
  tema: Tema;
  marca: Marca;
  contacto: Contacto;
  seo: Seo;
  bloques: Bloque[];
}

// ─── Contenido por defecto (la landing actual) ───────────────────────────────

const pollo = '$7.500';
const panal = '$20.000';
const nbsp = ' ';

export const SITE_DEFAULTS: SiteContent = {
  version: 1,
  tema: { fondo: '#1d3324', texto: '#f3eadb', acento: '#d0703a', titulos: 'hina', cuerpo: 'zen' },
  marca: {
    nombre: 'El Agropecuario',
    lema: 'Distribuidora de huevos y pollos',
    promesa: 'Fresco, listo y a tu puerta',
    pie: 'Pollo campesino y huevos colorados: de nuestra tierra a tu mesa.',
    logo: { src: 'asset:logo', alt: 'Logo de El Agropecuario, distribuidora de huevos y pollos' },
  },
  contacto: {
    whatsapp: '573126643482',
    telefono: '+57 312 664 3482',
    ubicacion: '[Ciudad]',
    zonaEntrega: 'toda la ciudad y sus alrededores',
    horario: `Lunes a sábado, de 7:00${nbsp}a.${nbsp}m. a 6:00${nbsp}p.${nbsp}m.`,
    entregas: `El mismo día si confirmas antes de las 10:00${nbsp}a.${nbsp}m.; después, al día siguiente`,
    pagos: 'Efectivo, Nequi, Llave o transferencia',
    instagram: '@[cuenta]',
    instagramUrl: 'https://www.instagram.com/',
    mensajePedido: 'Hola, {marca}. Quiero hacer un pedido a domicilio.',
  },
  seo: {
    titulo: 'El Agropecuario · Pollo campesino y huevos colorados a domicilio',
    descripcion: `Pollo campesino de piel amarilla natural, criado sin químicos ni aceleradores, y huevos colorados. Fresco del día, entero o despresado. Pide por WhatsApp: la libra de pollo a ${pollo} con domicilio incluido y el panal de huevos a ${panal}.`,
  },
  bloques: [
    {
      id: 'paseo',
      tipo: 'paseo',
      visible: true,
      video: '/video/pollos.mp4',
      poster: { src: 'asset:pollos', alt: 'Pollos jóvenes comiendo alrededor de un comedero rojo' },
      pista: 'Desliza para recorrer la finca',
      paradas: [
        {
          lugar: 'Los huevos',
          eyebrow: '',
          titulo: 'Del campo a tu mesa',
          texto:
            'Pollo campesino de piel amarilla natural, criado sin químicos ni aceleradores, y huevos colorados de gallinas al aire libre. Pides por WhatsApp y te lo llevamos el mismo día.',
          nota: '',
          estilo: 'chips',
          items: [
            { valor: `Pollo a ${pollo} la libra, domicilio incluido`, etiqueta: '' },
            { valor: `Panal de huevos a ${panal}`, etiqueta: '' },
            { valor: 'Entrega el mismo día', etiqueta: '' },
          ],
          boton: 'whatsapp',
        },
        {
          lugar: 'Las gallinas',
          eyebrow: 'Cómo criamos',
          titulo: 'Gallinas bien comidas, huevos con sabor',
          texto: 'Nuestras gallinas comen grano y verdura fresca todos los días, con espacio para moverse a su ritmo.',
          nota: 'Una gallina tranquila y bien alimentada pone mejor huevo. Por eso cuidamos el espacio, el agua limpia y la comida de cada día.',
          estilo: 'texto',
          items: [],
          boton: 'ninguno',
        },
        {
          lugar: 'El peso',
          eyebrow: 'Precios claros',
          titulo: 'Sabes lo que pagas antes de pedir',
          texto: `Todo se pesa. El pollo se pesa completo y cada libra vale ${pollo}, entero o despresado, con el domicilio incluido. Te confirmamos el total por WhatsApp antes de despachar.`,
          nota: '',
          estilo: 'cifras',
          items: [
            { valor: pollo, etiqueta: 'Libra de pollo, con domicilio incluido' },
            { valor: panal, etiqueta: 'Panal de 30 huevos colorados' },
          ],
          boton: 'productos',
        },
        {
          lugar: 'La selección',
          eyebrow: 'Frescura',
          titulo: 'Huevos de días, no de semanas',
          texto:
            'Recogemos los huevos cada día, los revisamos uno a uno y los empacamos en cubetas para que lleguen enteros a tu casa.',
          nota: '',
          estilo: 'tarjetas',
          items: [
            { valor: 'A diario', etiqueta: 'Recogida de huevos en la finca' },
            { valor: 'Uno a uno', etiqueta: 'Revisados antes de empacar' },
          ],
          boton: 'ninguno',
        },
        {
          lugar: 'Los pollos',
          eyebrow: 'Pollo de campo',
          titulo: 'Producción responsable, sabor auténtico del campo',
          texto:
            'Nuestros pollos crecen con espacio para caminar y luz natural. La carne queda firme y con el sabor del pollo de campo de toda la vida.',
          nota: '',
          estilo: 'numero',
          items: [{ valor: '2', etiqueta: 'Formas de llevarlo: entero o despresado a mano' }],
          boton: 'ninguno',
        },
        {
          lugar: 'Tu pedido',
          eyebrow: 'Cómo pedir',
          titulo: 'Tu pedido, en tres pasos',
          texto: '',
          nota: '',
          estilo: 'pasos',
          items: [
            { valor: 'Escríbenos por WhatsApp', etiqueta: 'Dinos qué productos quieres y cuántos.' },
            { valor: 'Confirmamos tu pedido', etiqueta: 'Te decimos el peso, el total y la hora de entrega.' },
            {
              valor: 'Lo recibes en casa',
              etiqueta: `Hoy mismo si confirmas antes de las 10:00${nbsp}a.${nbsp}m. Pagas al recibir: efectivo, Nequi, Llave o transferencia.`,
            },
          ],
          boton: 'whatsapp',
        },
      ],
    },
    {
      id: 'frase',
      tipo: 'frase',
      visible: true,
      lineas: ['Sin afanes:', 'gallinas al sol,', 'huevos recién recogidos,', 'pollo de campo de verdad.'],
    },
    {
      id: 'productos',
      tipo: 'productos',
      visible: true,
      eyebrow: 'Productos',
      titulo: 'Lo que sale de la finca',
      nota: `El pollo no se vende por libra fija: se pesa completo y **cada libra vale ${pollo}**, entero o despresado, **con el domicilio incluido**.`,
      items: [
        { nombre: 'Panal de huevos colorados', detalle: 'Cubeta de 30 huevos colorados', precio: panal, foto: { src: '', alt: '' } },
        {
          nombre: 'Pollo campesino entero',
          detalle: 'Fresco del día, sin cortar. Se pesa completo y pagas lo que pese. Domicilio incluido',
          precio: `${pollo} / lb`,
          foto: { src: '', alt: '' },
        },
        {
          nombre: 'Pollo campesino despresado',
          detalle:
            'Despresado a mano en pechuga, piernas, alas, contramuslo y menudencias. Mismo precio por libra, domicilio incluido',
          precio: `${pollo} / lb`,
          foto: { src: '', alt: '' },
        },
      ],
    },
    {
      id: 'diferencia',
      tipo: 'diferencia',
      visible: true,
      eyebrow: 'La diferencia se nota',
      titulo: 'Pollo campesino frente al de supermercado',
      texto: 'Lo notas en el color de la piel, en la textura de la carne y en el caldo.',
      nombreOtro: 'Supermercado',
      filas: [
        { nuestro: 'Piel amarilla natural', otro: 'Piel pálida' },
        { nuestro: 'Crianza libre en el campo', otro: 'Confinamiento industrial' },
        { nuestro: 'Sin aceleradores de engorde', otro: 'Hormonas y químicos' },
        { nuestro: 'Sabor y textura de antes', otro: 'Aguado y sin sabor' },
        { nuestro: 'Entero o despresado a mano, tú eliges', otro: 'Empacado en fábrica, sin opción' },
      ],
      video: '/video/pollos.mp4',
      poster: { src: 'asset:pollos', alt: 'Pollos jóvenes comiendo alrededor de un comedero rojo' },
      eyebrow2: 'Del campo a tu mesa',
      titulo2: 'Un proceso honesto, sin atajos',
      pasos: [
        { titulo: 'Crianza libre', texto: 'En el campo, comiendo maíz y hierba, a su ritmo natural.' },
        { titulo: 'Sacrificio del día', texto: 'Sin días de congelador: fresco, no dormido en la nevera.' },
        { titulo: 'Entero o despresado', texto: 'Se pesa completo. Si lo pides despresado, lo cortamos a mano antes de empacar.' },
        { titulo: 'En tu puerta', texto: 'Domicilio el mismo día, refrigerado y listo para cocinar.' },
      ],
    },
    {
      id: 'opiniones',
      tipo: 'opiniones',
      visible: true,
      eyebrow: 'Lo que dicen los clientes',
      titulo: 'Se prueba una vez y se pide siempre',
      items: [
        { texto: 'El caldo me quedó amarillito como el de mi mamá. Se nota que es pollo de verdad.', autor: 'Marcela P.' },
        { texto: 'Llevo tres meses pidiendo y ya no vuelvo al supermercado. El sabor es otro nivel.', autor: 'Andrés G.' },
        { texto: 'Pedí por WhatsApp a las 9 y a las 12 ya lo tenía en la puerta. Fresquísimo.', autor: 'Laura R.' },
      ],
    },
    {
      id: 'preguntas',
      tipo: 'preguntas',
      visible: true,
      eyebrow: 'Preguntas frecuentes',
      titulo: 'Antes de pedir',
      texto: '¿Te queda alguna duda? Escríbenos o llámanos:',
      items: [
        {
          pregunta: '¿Por qué los huevos son colorados?',
          respuesta:
            'El color de la cáscara depende de la raza de la gallina. Las gallinas de plumaje rojizo ponen huevos de cáscara colorada.',
        },
        {
          pregunta: '¿Cómo se crían las gallinas?',
          respuesta:
            'Nuestras gallinas salen al pasto durante el día y vuelven al gallinero a dormir y a poner. Así tienen espacio, sol y movimiento.',
        },
        {
          pregunta: '¿Qué tan frescos llegan los huevos?',
          respuesta: 'Recogemos los huevos a diario y los llevamos en los días siguientes a la recogida.',
        },
        {
          pregunta: '¿Cuánto valen el pollo y los huevos?',
          respuesta: `La libra vale ${pollo} con el domicilio incluido. No vendemos por libra fija: se pesa el pollo completo y lo que pese se multiplica por el precio de la libra. El panal de 30 huevos colorados vale ${panal}.`,
        },
        {
          pregunta: '¿Lo puedo pedir entero o despresado?',
          respuesta:
            'Las dos opciones, tú eliges. El precio por libra es el mismo; si lo pides despresado, lo cortamos a mano antes de despachar.',
        },
        {
          pregunta: '¿Por qué la piel del pollo es amarilla?',
          respuesta:
            'Porque el pollo come maíz y pasto. No es un color inducido con químicos: es su color natural cuando se cría bien.',
        },
        {
          pregunta: '¿Cómo hago un pedido?',
          respuesta:
            'Escríbenos por WhatsApp con lo que necesitas. Te confirmamos disponibilidad, peso, total y domicilio por el mismo chat.',
        },
        {
          pregunta: '¿Cuál es la zona de cobertura?',
          respuesta:
            'Cubrimos toda la ciudad y sus alrededores. Escríbenos por WhatsApp y te confirmamos el domicilio para tu barrio.',
        },
        {
          pregunta: '¿A qué hora hacen entregas?',
          respuesta: `Recibimos pedidos de lunes a sábado de 7:00${nbsp}a.${nbsp}m. a 6:00${nbsp}p.${nbsp}m. Los pedidos confirmados antes de las 10:00${nbsp}a.${nbsp}m. se entregan el mismo día; los que llegan después, al día siguiente.`,
        },
        {
          pregunta: '¿Cómo pago?',
          respuesta:
            'Al recibir: efectivo, Nequi, Llave o transferencia. Te confirmamos el total por WhatsApp antes de despachar.',
        },
        {
          pregunta: '¿Cómo conservo los huevos?',
          respuesta:
            'En la nevera, dentro de la cubeta y con la punta hacia abajo. No los laves al guardarlos: lávalos justo antes de usarlos.',
        },
        {
          pregunta: '¿Cómo conservo el pollo?',
          respuesta:
            'En la nevera, úsalo en uno o dos días. Si no lo vas a cocinar pronto, congélalo el mismo día en porciones.',
        },
      ],
    },
    {
      id: 'semanal',
      tipo: 'semanal',
      visible: true,
      eyebrow: 'Pedido fijo',
      titulo: 'Huevos frescos cada semana, sin acordarte',
      texto:
        'Dinos qué necesitas y cada cuánto. Te lo llevamos el mismo día de cada semana y lo cambias o pausas cuando quieras por WhatsApp.',
      boton: 'Quiero mi pedido semanal',
      mensaje: 'Hola, {marca}. Me interesa el pedido fijo cada semana.',
      imagen: { src: 'asset:seleccion', alt: 'Una mano acomoda huevos colorados en su cubeta' },
    },
    {
      id: 'final',
      tipo: 'final',
      visible: true,
      titulo: 'Pide hoy,\ncocínalo hoy',
      texto: `Un mensaje por WhatsApp y en unas horas está en tu cocina. Si confirmas antes de las 10:00${nbsp}a.${nbsp}m., lo recibes el mismo día en toda la ciudad y sus alrededores.`,
      boton: 'Pedir por WhatsApp',
    },
  ],
};

// ─── Definición de campos para el editor ─────────────────────────────────────

export type FieldDef =
  | { key: string; label: string; type: 'text' | 'textarea' | 'color' | 'video' | 'image' | 'lines'; help?: string; max?: number }
  | { key: string; label: string; type: 'font'; uso: 'titulos' | 'cuerpo'; help?: string }
  | { key: string; label: string; type: 'select'; options: Record<string, string>; help?: string }
  | { key: string; label: string; type: 'list'; fields: FieldDef[]; itemLabel: string; help?: string; max?: number; min?: number };

const RICH = 'Usa **así** para poner una parte en negrita.';

export const BLOCK_DEFS: Record<TipoBloque, { nombre: string; descripcion: string; ancla: string; menu?: string; fields: FieldDef[] }> = {
  paseo: {
    nombre: 'Paseo con video (portada)',
    descripcion: 'La portada: el video de fondo y las paradas que cambian al hacer scroll.',
    ancla: 'inicio',
    menu: 'Inicio',
    fields: [
      { key: 'video', label: 'Video de fondo', type: 'video', help: 'Archivo .mp4 vertical dentro de public/video, o una URL https.' },
      { key: 'poster', label: 'Imagen mientras carga el video', type: 'image' },
      { key: 'pista', label: 'Texto "desliza" (escritorio)', type: 'text', max: 60 },
      {
        key: 'paradas',
        label: 'Paradas',
        type: 'list',
        itemLabel: 'Parada',
        min: 1,
        max: 8,
        help: 'La primera es la portada: su título es el titular principal de la página.',
        fields: [
          { key: 'lugar', label: 'Nombre corto (menú lateral)', type: 'text', max: 30 },
          { key: 'eyebrow', label: 'Antetítulo', type: 'text', max: 40 },
          { key: 'titulo', label: 'Título', type: 'text', max: 90 },
          { key: 'texto', label: 'Texto', type: 'textarea', max: 400, help: RICH },
          { key: 'nota', label: 'Texto secundario', type: 'textarea', max: 300 },
          { key: 'estilo', label: 'Cómo se muestran los datos', type: 'select', options: STOP_STYLES },
          {
            key: 'items',
            label: 'Datos',
            type: 'list',
            itemLabel: 'Dato',
            max: 6,
            fields: [
              { key: 'valor', label: 'Valor o título', type: 'text', max: 80 },
              { key: 'etiqueta', label: 'Descripción', type: 'text', max: 160 },
            ],
          },
          { key: 'boton', label: 'Botón', type: 'select', options: STOP_BUTTONS },
        ],
      },
    ],
  },
  frase: {
    nombre: 'Frase destacada',
    descripcion: 'La frase grande que se ilumina palabra por palabra.',
    ancla: 'frase',
    fields: [{ key: 'lineas', label: 'Líneas (una por renglón)', type: 'lines', max: 200 }],
  },
  productos: {
    nombre: 'Productos',
    descripcion: 'Lista de productos con su precio.',
    ancla: 'productos',
    menu: 'Productos',
    fields: [
      { key: 'eyebrow', label: 'Antetítulo', type: 'text', max: 40 },
      { key: 'titulo', label: 'Título', type: 'text', max: 90 },
      {
        key: 'items',
        label: 'Productos',
        type: 'list',
        itemLabel: 'Producto',
        max: 20,
        fields: [
          { key: 'nombre', label: 'Nombre', type: 'text', max: 80 },
          { key: 'detalle', label: 'Detalle', type: 'textarea', max: 300 },
          { key: 'precio', label: 'Precio', type: 'text', max: 40 },
          { key: 'foto', label: 'Foto (opcional)', type: 'image' },
        ],
      },
      { key: 'nota', label: 'Nota bajo la lista', type: 'textarea', max: 400, help: RICH },
    ],
  },
  diferencia: {
    nombre: 'La diferencia',
    descripcion: 'Comparación con la competencia y el proceso, con un video.',
    ancla: 'diferencia',
    fields: [
      { key: 'eyebrow', label: 'Antetítulo', type: 'text', max: 40 },
      { key: 'titulo', label: 'Título', type: 'text', max: 90 },
      { key: 'texto', label: 'Texto', type: 'textarea', max: 300 },
      { key: 'nombreOtro', label: 'Con quién se compara', type: 'text', max: 40 },
      {
        key: 'filas',
        label: 'Comparación',
        type: 'list',
        itemLabel: 'Fila',
        max: 12,
        fields: [
          { key: 'nuestro', label: 'Lo nuestro', type: 'text', max: 80 },
          { key: 'otro', label: 'Lo otro', type: 'text', max: 80 },
        ],
      },
      { key: 'video', label: 'Video', type: 'video' },
      { key: 'poster', label: 'Imagen del video', type: 'image' },
      { key: 'eyebrow2', label: 'Antetítulo del proceso', type: 'text', max: 40 },
      { key: 'titulo2', label: 'Título del proceso', type: 'text', max: 90 },
      {
        key: 'pasos',
        label: 'Pasos del proceso',
        type: 'list',
        itemLabel: 'Paso',
        max: 8,
        fields: [
          { key: 'titulo', label: 'Título', type: 'text', max: 60 },
          { key: 'texto', label: 'Texto', type: 'textarea', max: 200 },
        ],
      },
    ],
  },
  opiniones: {
    nombre: 'Opiniones',
    descripcion: 'Testimonios de clientes.',
    ancla: 'opiniones',
    menu: 'Opiniones',
    fields: [
      { key: 'eyebrow', label: 'Antetítulo', type: 'text', max: 40 },
      { key: 'titulo', label: 'Título', type: 'text', max: 90 },
      {
        key: 'items',
        label: 'Opiniones',
        type: 'list',
        itemLabel: 'Opinión',
        max: 9,
        fields: [
          { key: 'texto', label: 'Opinión', type: 'textarea', max: 300 },
          { key: 'autor', label: 'Nombre', type: 'text', max: 60 },
        ],
      },
    ],
  },
  preguntas: {
    nombre: 'Preguntas frecuentes',
    descripcion: 'Preguntas y respuestas. También salen en Google como FAQ.',
    ancla: 'preguntas',
    menu: 'Preguntas',
    fields: [
      { key: 'eyebrow', label: 'Antetítulo', type: 'text', max: 40 },
      { key: 'titulo', label: 'Título', type: 'text', max: 90 },
      { key: 'texto', label: 'Texto junto al título', type: 'textarea', max: 300 },
      {
        key: 'items',
        label: 'Preguntas',
        type: 'list',
        itemLabel: 'Pregunta',
        max: 30,
        fields: [
          { key: 'pregunta', label: 'Pregunta', type: 'text', max: 150 },
          { key: 'respuesta', label: 'Respuesta', type: 'textarea', max: 800, help: RICH },
        ],
      },
    ],
  },
  semanal: {
    nombre: 'Pedido semanal',
    descripcion: 'Oferta de pedido fijo, con foto y botón de WhatsApp.',
    ancla: 'semanal',
    fields: [
      { key: 'eyebrow', label: 'Antetítulo', type: 'text', max: 40 },
      { key: 'titulo', label: 'Título', type: 'text', max: 90 },
      { key: 'texto', label: 'Texto', type: 'textarea', max: 400, help: RICH },
      { key: 'boton', label: 'Texto del botón', type: 'text', max: 40 },
      { key: 'mensaje', label: 'Mensaje de WhatsApp', type: 'text', max: 200, help: '{marca} se cambia por el nombre.' },
      { key: 'imagen', label: 'Foto', type: 'image' },
    ],
  },
  final: {
    nombre: 'Llamado final',
    descripcion: 'Cierre con el logo, horario, medios de pago y el botón de pedir.',
    ancla: 'pedir',
    fields: [
      { key: 'titulo', label: 'Título', type: 'textarea', max: 90, help: 'Un salto de línea parte el título en dos renglones.' },
      { key: 'texto', label: 'Texto', type: 'textarea', max: 400, help: RICH },
      { key: 'boton', label: 'Texto del botón', type: 'text', max: 40 },
    ],
  },
};

/** Ajustes generales del sitio, en el mismo formato que los bloques. */
export const SETTINGS_DEFS: { key: 'tema' | 'marca' | 'contacto' | 'seo'; nombre: string; descripcion: string; fields: FieldDef[] }[] = [
  {
    key: 'tema',
    nombre: 'Colores y tipografía',
    descripcion: 'Se aplican a toda la página.',
    fields: [
      { key: 'fondo', label: 'Fondo', type: 'color' },
      { key: 'texto', label: 'Texto', type: 'color' },
      { key: 'acento', label: 'Acento (botones y detalles)', type: 'color' },
      { key: 'titulos', label: 'Tipografía de títulos', type: 'font', uso: 'titulos' },
      { key: 'cuerpo', label: 'Tipografía de textos', type: 'font', uso: 'cuerpo' },
    ],
  },
  {
    key: 'marca',
    nombre: 'Marca',
    descripcion: 'Nombre, lema y logo (cabecera, pie y llamado final).',
    fields: [
      { key: 'nombre', label: 'Nombre', type: 'text', max: 60 },
      { key: 'lema', label: 'Lema', type: 'text', max: 80 },
      { key: 'promesa', label: 'Promesa (pie de página)', type: 'text', max: 60 },
      { key: 'pie', label: 'Frase del pie de página', type: 'textarea', max: 200 },
      { key: 'logo', label: 'Logo', type: 'image', help: 'Cuadrado; se muestra en un círculo.' },
    ],
  },
  {
    key: 'contacto',
    nombre: 'Contacto y pedidos',
    descripcion: 'WhatsApp, teléfono, horario, zona y pagos. Salen en varios bloques y en el pie.',
    fields: [
      { key: 'whatsapp', label: 'WhatsApp (con indicativo, solo números)', type: 'text', max: 15 },
      { key: 'mensajePedido', label: 'Mensaje al pulsar "Pedir"', type: 'text', max: 200, help: '{marca} se cambia por el nombre.' },
      { key: 'telefono', label: 'Teléfono (como se muestra)', type: 'text', max: 30 },
      { key: 'ubicacion', label: 'Ciudad o municipio', type: 'text', max: 60 },
      { key: 'zonaEntrega', label: 'Zona de entrega', type: 'text', max: 100 },
      { key: 'horario', label: 'Horario de pedidos', type: 'text', max: 120 },
      { key: 'entregas', label: 'Entregas', type: 'text', max: 160 },
      { key: 'pagos', label: 'Medios de pago', type: 'text', max: 120 },
      { key: 'instagram', label: 'Instagram (como se muestra)', type: 'text', max: 40, help: 'Vacío para no mostrarlo.' },
      { key: 'instagramUrl', label: 'Enlace de Instagram', type: 'text', max: 200 },
    ],
  },
  {
    key: 'seo',
    nombre: 'Google y redes (SEO)',
    descripcion: 'Título y descripción que ven Google y WhatsApp al compartir el enlace.',
    fields: [
      { key: 'titulo', label: 'Título de la página', type: 'text', max: 70, help: 'Ideal: menos de 60 caracteres.' },
      { key: 'descripcion', label: 'Descripción', type: 'textarea', max: 300, help: 'Ideal: entre 120 y 160 caracteres.' },
    ],
  },
];

// ─── Validación ──────────────────────────────────────────────────────────────

const HEX_RE = /^#[0-9a-f]{6}$/i;
const MEDIA_RE = /^\/media\/[0-9a-f-]{36}$/;
/** Imágenes del proyecto que se pueden usar con "asset:<clave>" (las resuelve src/data/assets.ts). */
export const ASSET_KEYS = ['logo', 'pollos', 'bascula', 'amanecer', 'gallinas', 'nidos', 'recogida', 'seleccion', 'entrega'] as const;

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

function okImageSrc(src: string) {
  return (
    src === '' ||
    MEDIA_RE.test(src) ||
    (src.startsWith('asset:') && (ASSET_KEYS as readonly string[]).includes(src.slice(6))) ||
    /^\/(photos|video)\/[\w./-]+$/.test(src)
  );
}

function okVideo(src: string) {
  return src === '' || /^\/video\/[\w.-]+\.(mp4|webm)$/.test(src) || /^https:\/\/[^\s"'<>]+$/.test(src);
}

/**
 * Normaliza un valor según su definición, partiendo del valor por defecto. Lo que no encaja se queda con el valor
 * por defecto y se anota en `errors` (para el editor). Nunca devuelve tipos inesperados a la landing.
 */
function cleanField(def: FieldDef, value: unknown, fallback: unknown, where: string, errors: string[]): unknown {
  switch (def.type) {
    case 'text':
    case 'textarea': {
      if (typeof value !== 'string') return fallback;
      const v = value.replace(/\r\n/g, '\n');
      if (def.max && v.length > def.max) errors.push(`${where}: máximo ${def.max} caracteres.`);
      return v.slice(0, def.max ?? 2000);
    }
    case 'lines': {
      const arr = Array.isArray(value) ? value : typeof value === 'string' ? value.split('\n') : null;
      if (!arr) return fallback;
      return arr
        .map((l) => String(l).trim())
        .filter(Boolean)
        .slice(0, 12)
        .map((l) => l.slice(0, def.max ?? 200));
    }
    case 'color':
      if (typeof value === 'string' && HEX_RE.test(value)) return value.toLowerCase();
      if (value !== undefined) errors.push(`${where}: color no válido.`);
      return fallback;
    case 'font':
      return typeof value === 'string' && value in FONTS ? value : fallback;
    case 'select':
      return typeof value === 'string' && value in def.options ? value : fallback;
    case 'video':
      if (typeof value === 'string' && okVideo(value.trim())) return value.trim();
      if (value !== undefined) errors.push(`${where}: el video debe ser /video/archivo.mp4 o una URL https.`);
      return fallback;
    case 'image': {
      const fb = (isObj(fallback) ? fallback : { src: '', alt: '' }) as Img;
      if (!isObj(value)) return fb;
      const src = typeof value.src === 'string' ? value.src.trim() : fb.src;
      if (!okImageSrc(src)) {
        errors.push(`${where}: imagen no válida.`);
        return fb;
      }
      return { src, alt: typeof value.alt === 'string' ? value.alt.slice(0, 200) : fb.alt };
    }
    case 'list': {
      if (!Array.isArray(value)) return fallback;
      const fbItems = Array.isArray(fallback) ? fallback : [];
      if (def.max && value.length > def.max) errors.push(`${where}: como mucho ${def.max}.`);
      if (def.min && value.length < def.min) errors.push(`${where}: al menos ${def.min}.`);
      // Los elementos nuevos parten de un elemento vacío (no de uno de los de por defecto).
      const blank = emptyItem(def.fields);
      return value.slice(0, def.max ?? 50).map((item, i) =>
        cleanObject(def.fields, item, i < fbItems.length ? { ...blank, ...fbItems[i] } : blank, `${where} ${i + 1}`, errors),
      );
    }
  }
}

function cleanObject(fields: FieldDef[], value: unknown, fallback: Record<string, unknown>, where: string, errors: string[]) {
  const v = isObj(value) ? value : {};
  const out: Record<string, unknown> = {};
  for (const f of fields) out[f.key] = cleanField(f, v[f.key], fallback[f.key], `${where} · ${f.label}`, errors);
  return out;
}

/** Elemento vacío de una lista (para "Añadir" en el editor). */
export function emptyItem(fields: FieldDef[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.type === 'list' || f.type === 'lines') out[f.key] = [];
    else if (f.type === 'image') out[f.key] = { src: '', alt: '' };
    else if (f.type === 'select') out[f.key] = Object.keys(f.options)[0];
    else out[f.key] = '';
  }
  return out;
}

/**
 * Limpia un contenido que llega del editor o de la base. Completa lo que falte con SITE_DEFAULTS, conserva el orden y
 * la visibilidad de los bloques y añade al final los tipos de bloque que no estén (para no perder ninguno).
 */
export function parseSite(input: unknown): { value: SiteContent; errors: string[] } {
  const errors: string[] = [];
  const raw = isObj(input) ? input : {};
  const d = SITE_DEFAULTS;
  const out = { version: 1 } as SiteContent;
  for (const s of SETTINGS_DEFS) {
    (out as unknown as Record<string, unknown>)[s.key] = cleanObject(
      s.fields,
      raw[s.key],
      d[s.key] as unknown as Record<string, unknown>,
      s.nombre,
      errors,
    );
  }
  const wa = out.contacto.whatsapp.replace(/\D/g, '');
  out.contacto.whatsapp = wa.length >= 8 ? wa : d.contacto.whatsapp;
  if (out.contacto.instagramUrl && !/^https:\/\//.test(out.contacto.instagramUrl)) {
    errors.push('Contacto · Enlace de Instagram: debe empezar por https://');
    out.contacto.instagramUrl = d.contacto.instagramUrl;
  }

  const seen = new Set<TipoBloque>();
  const bloques: Bloque[] = [];
  for (const b of Array.isArray(raw.bloques) ? raw.bloques : []) {
    if (!isObj(b) || typeof b.tipo !== 'string' || !(b.tipo in BLOCK_DEFS) || seen.has(b.tipo as TipoBloque)) continue;
    const tipo = b.tipo as TipoBloque;
    seen.add(tipo);
    const def = BLOCK_DEFS[tipo];
    const fallback = d.bloques.find((x) => x.tipo === tipo)!;
    bloques.push({
      ...(cleanObject(def.fields, b, fallback as unknown as Record<string, unknown>, def.nombre, errors) as object),
      id: tipo,
      tipo,
      visible: b.visible !== false,
    } as Bloque);
  }
  for (const b of d.bloques) if (!seen.has(b.tipo)) bloques.push(structuredClone(b));
  // La portada va siempre primero: es el titular de la página.
  bloques.sort((a, b) => (a.tipo === 'paseo' ? -1 : b.tipo === 'paseo' ? 1 : 0));
  out.bloques = bloques;
  return { value: out, errors };
}

// ─── Utilidades para la landing ──────────────────────────────────────────────

export function bloque<T extends TipoBloque>(site: SiteContent, tipo: T) {
  return site.bloques.find((b) => b.tipo === tipo) as Extract<Bloque, { tipo: T }>;
}

export const conMarca = (texto: string, site: SiteContent) => texto.replaceAll('{marca}', site.marca.nombre);

/** Enlace de WhatsApp con un mensaje. */
export const waLink = (site: SiteContent, mensaje: string) =>
  `https://wa.me/${site.contacto.whatsapp}?text=${encodeURIComponent(conMarca(mensaje, site))}`;

export const links = (site: SiteContent) => ({
  pedir: waLink(site, site.contacto.mensajePedido),
  telefono: `tel:+${site.contacto.whatsapp}`,
});

/** Menú: los bloques visibles que tienen entrada de menú, en su orden. */
export const menu = (site: SiteContent) =>
  site.bloques
    .filter((b) => b.visible && BLOCK_DEFS[b.tipo].menu)
    .map((b) => ({ label: BLOCK_DEFS[b.tipo].menu!, href: `#${BLOCK_DEFS[b.tipo].ancla}` }));

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Texto con **negritas** y saltos de línea, escapado: seguro para set:html. */
export const rich = (s: string) =>
  escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />');

/** Texto plano (sin marcas), para SEO y JSON-LD. */
export const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\s*\n\s*/g, ' ');

/** "Efectivo, Nequi…" → "efectivo, Nequi…" dentro de una frase. */
export const enFrase = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

// Contraste WCAG entre dos colores hex.
function lum(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
export function contrast(a: string, b: string) {
  if (!HEX_RE.test(a) || !HEX_RE.test(b)) return 21;
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Variables CSS del tema (colores y tipografías). */
export function temaCss(t: Tema) {
  const f = (k: FontKey) => `var(${FONTS[k].css}), ${FONTS[k].fallback}`;
  return `:root{--color-bg:${t.fondo};--color-crema:${t.texto};--color-teja:${t.acento};--font-display:${f(t.titulos)};--font-sans:${f(t.cuerpo)}}`;
}
