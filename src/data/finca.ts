// Contenido de la landing de la finca: huevos colorados y pollo de campo.
// Lo que todavía no está confirmado por el negocio va marcado como `pending` (o con <Pending>) y solo se ve en
// desarrollo. Los valores entre corchetes son provisionales: hay que cambiarlos antes de publicar.

import type { ImageMetadata } from 'astro';
import amanecer from '../assets/photos/0-amanecer.webp';
import gallinas from '../assets/photos/1-gallinas.webp';
import nidos from '../assets/photos/2-nidos.webp';
import recogida from '../assets/photos/3-recogida.webp';
import pollos from '../assets/photos/4-pollos.webp';
import seleccion from '../assets/photos/5-seleccion.webp';
import entrega from '../assets/photos/6-entrega.webp';
// Primer fotograma de cada clip del paseo, sacado del propio MP4 para que encaje exactamente con él:
// ffmpeg -i public/video/paseo-1.mp4 -frames:v 1 -vf "scale=in_color_matrix=bt709:in_range=tv:out_range=pc,format=rgb24" paseo-1.png
// La parada 3 no tiene vídeo: su "póster" es la foto del huevo en la báscula.
import poster1 from '../assets/paseo/paseo-1.webp';
import poster2 from '../assets/paseo/paseo-2.webp';
import poster3 from '../assets/paseo/paseo-3.webp';
import poster4 from '../assets/paseo/paseo-4.webp';
import poster5 from '../assets/paseo/paseo-5.webp';
import poster6 from '../assets/paseo/paseo-6.webp';

export const photos = { amanecer, gallinas, nidos, recogida, pollos, seleccion, entrega };

// Marca. Cambiándola aquí cambia en toda la web (logo, títulos, SEO y JSON-LD).
export const marca = {
  nombre: 'El Agropecuario',
  lema: 'Distribuidora de huevos y pollos',
  /** Frase corta de cierre (pie, botones secundarios). */
  promesa: 'Fresco, listo y a tu puerta',
};

export const seo = {
  title: `${marca.nombre} · Pollo campesino y huevos colorados a domicilio`,
  description:
    'Pollo campesino de piel amarilla natural, criado sin químicos ni aceleradores, y huevos colorados. Fresco del día, entero o despresado. Pide por WhatsApp: la libra de pollo a $4.500.',
};

/** Precio del pollo por libra (entero o despresado, mismo precio). */
export const precioPollo = '$4.500';

// Paseo (scroll world): vídeos reales, verticales, grabados con el celular. Un tramo por parada; avanza o retrocede con
// el scroll. Mientras el clip de un tramo no ha cargado se ve su primer fotograma (`poster`).
// Para que el scrub sea fluido, cada clip necesita keyframes muy seguidos (-g 3, sin B-frames). A 30 fps cada tramo ya
// tiene de 97 a 240 fotogramas, así que no hace falta interpolar. El color va marcado como BT.709 con curva sRGB: sin
// marcar, el navegador pinta el vídeo más claro que el póster y el cambio se nota. Los originales están en media/video-real.
// ffmpeg -ss 0 -to 8 -i original.mp4 -an -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=30" -c:v libx264 -preset slow -crf 24 -g 3 -keyint_min 3 -sc_threshold 0 -bf 0 -pix_fmt yuv420p -color_primaries bt709 -color_trc iec61966-2-1 -colorspace bt709 -color_range tv -movflags +faststart+write_colr public/video/paseo-1.mp4
export type Parada = {
  id: string;
  lugar: string;
  /** Clip de este tramo. Sin clip, el tramo muestra solo su póster (una foto). */
  clip?: string;
  /** Punto horizontal (0 a 100) que queda a la vista cuando el vertical se recorta por los lados. */
  focus: number;
  /** Primer fotograma del clip (vertical, como el vídeo). Se ve mientras el clip carga y encaja con él al aparecer. */
  poster: ImageMetadata;
  alt: string;
};

export const paseo: { paradas: Parada[] } = {
  paradas: [
    {
      id: 'inicio',
      lugar: 'Los huevos',
      clip: '/video/paseo-1.mp4',
      focus: 50,
      poster: poster1,
      alt: 'Cubetas de cartón llenas de huevos colorados',
    },
    {
      id: 'crianza',
      lugar: 'Las gallinas',
      clip: '/video/paseo-2.mp4',
      focus: 50,
      poster: poster2,
      alt: 'Gallinas coloradas comiendo verdura fresca en un comedero rojo',
    },
    {
      id: 'precios',
      lugar: 'El peso',
      focus: 50,
      poster: poster3,
      alt: 'Un huevo colorado sobre una báscula de cocina que marca 79 gramos, delante de una cubeta de huevos',
    },
    {
      id: 'frescura',
      lugar: 'La selección',
      clip: '/video/paseo-4.mp4',
      focus: 50,
      poster: poster4,
      alt: 'Primeros planos de huevos colorados en su cubeta',
    },
    {
      id: 'pollo',
      lugar: 'Los pollos',
      clip: '/video/paseo-5.mp4',
      focus: 50,
      poster: poster5,
      alt: 'Pollos jóvenes alrededor de un comedero rojo con alimento',
    },
    {
      id: 'como-pedir',
      lugar: 'Tu pedido',
      clip: '/video/paseo-6.mp4',
      focus: 50,
      poster: poster6,
      alt: 'Pollos jóvenes comiendo en el galpón',
    },
  ],
};

// WhatsApp con indicativo de país, sin espacios ni signos.
const whatsapp = '573126643482';
const wa = (mensaje: string) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`;

export const links = {
  pedir: wa(`Hola, ${marca.nombre}. Quiero hacer un pedido a domicilio.`),
  pedirEntero: wa(`Hola, ${marca.nombre}. Quiero pedir un pollo entero. ¿Me confirmas disponibilidad, peso y domicilio?`),
  pedirDespresado: wa(
    `Hola, ${marca.nombre}. Quiero pedir un pollo despresado. ¿Me confirmas disponibilidad, peso y domicilio?`,
  ),
  semanal: wa(`Hola, ${marca.nombre}. Me interesa el pedido fijo cada semana.`),
  telefono: `tel:+${whatsapp}`,
  // PENDIENTE: Instagram real, o quitarlo del pie si no hay.
  instagram: 'https://www.instagram.com/',
};

export const contacto = {
  // PENDIENTE: ciudad o municipio desde donde se despacha.
  ubicacion: '[Ciudad]',
  zonaEntrega: 'toda la ciudad y sus alrededores',
  telefono: '+57 312 664 3482',
  // PENDIENTE: cuenta de Instagram.
  instagram: '@[cuenta]',
  horario: 'Lunes a sábado, de 7:00\u00a0a.\u00a0m. a 6:00\u00a0p.\u00a0m.',
  entregas: 'El mismo día si confirmas antes de las 10:00\u00a0a.\u00a0m.; después, al día siguiente',
  /** Medios de pago, al recibir. Con mayúscula inicial; dentro de una frase, usar `pagosEnFrase`. */
  pagos: 'Efectivo, Nequi, Llave o transferencia',
  pagosEnFrase: 'efectivo, Nequi, Llave o transferencia',
};

export const nav = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Productos', href: '#productos' },
  { label: 'Opiniones', href: '#opiniones' },
  { label: 'Preguntas', href: '#preguntas' },
];

export type Producto = { nombre: string; detalle: string; precio: string };

// El pollo no va por libra fija: se pesa completo y cada libra vale `precioPollo`, entero o despresado.
// PENDIENTE: precio de los huevos.
export const productos: Producto[] = [
  { nombre: 'Cubeta de huevos colorados', detalle: '30 huevos recogidos en la finca', precio: '$ —' },
  { nombre: 'Media cubeta', detalle: '15 huevos colorados', precio: '$ —' },
  {
    nombre: 'Pollo campesino entero',
    detalle: 'Fresco del día, sin cortar. Se pesa completo y pagas lo que pese',
    precio: `${precioPollo} / lb`,
  },
  {
    nombre: 'Pollo campesino despresado',
    detalle: 'Despresado a mano en pechuga, piernas, alas, contramuslo y menudencias. Mismo precio por libra',
    precio: `${precioPollo} / lb`,
  },
];

/** Pollo campesino frente al de supermercado. */
export const comparacion = [
  { nuestro: 'Piel amarilla natural', otro: 'Piel pálida' },
  { nuestro: 'Crianza libre en el campo', otro: 'Confinamiento industrial' },
  { nuestro: 'Sin aceleradores de engorde', otro: 'Hormonas y químicos' },
  { nuestro: 'Sabor y textura de antes', otro: 'Aguado y sin sabor' },
  { nuestro: 'Entero o despresado a mano, tú eliges', otro: 'Empacado en fábrica, sin opción' },
];

/** Cómo llega el pollo del campo a la mesa. */
export const procesoPollo = [
  { titulo: 'Crianza libre', texto: 'En el campo, comiendo maíz y hierba, a su ritmo natural.' },
  { titulo: 'Sacrificio del día', texto: 'Sin días de congelador: fresco, no dormido en la nevera.' },
  { titulo: 'Entero o despresado', texto: 'Se pesa completo. Si lo pides despresado, lo cortamos a mano antes de empacar.' },
  { titulo: 'En tu puerta', texto: 'Domicilio el mismo día, refrigerado y listo para cocinar.' },
];

/** Opiniones de clientes reales (confirmadas por el negocio). */
export const testimonios = [
  { texto: 'El caldo me quedó amarillito como el de mi mamá. Se nota que es pollo de verdad.', autor: 'Marcela P.' },
  {
    texto: 'Llevo tres meses pidiendo y ya no vuelvo al supermercado. El sabor es otro nivel.',
    autor: 'Andrés G.',
  },
  { texto: 'Pedí por WhatsApp a las 9 y a las 12 ya lo tenía en la puerta. Fresquísimo.', autor: 'Laura R.' },
];

export type Faq = { pregunta: string; respuesta: string; pending?: string };

export const faqs: Faq[] = [
  {
    pregunta: '¿Por qué los huevos son colorados?',
    respuesta:
      'El color de la cáscara depende de la raza de la gallina. Las gallinas de plumaje rojizo ponen huevos de cáscara colorada.',
  },
  {
    pregunta: '¿Cómo se crían las gallinas?',
    respuesta:
      'Nuestras gallinas salen al pasto durante el día y vuelven al gallinero a dormir y a poner. Así tienen espacio, sol y movimiento.',
    pending: 'Confirmar cómo se crían las gallinas y con qué se alimentan.',
  },
  {
    pregunta: '¿Qué tan frescos llegan los huevos?',
    respuesta: 'Recogemos los huevos a diario y los llevamos en los días siguientes a la recogida.',
    pending: 'Confirmar cada cuánto se recoge y cuántos días pasan hasta la entrega.',
  },
  {
    pregunta: '¿Cuánto vale el pollo?',
    respuesta: `La libra vale ${precioPollo}. No vendemos por libra fija: se pesa el pollo completo y lo que pese se multiplica por el precio de la libra.`,
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
    respuesta:
      'Recibimos pedidos de lunes a sábado de 7:00\u00a0a.\u00a0m. a 6:00\u00a0p.\u00a0m. Los pedidos confirmados antes de las 10:00\u00a0a.\u00a0m. se entregan el mismo día; los que llegan después, al día siguiente.',
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
];

export const faqsPendientes = ['¿Hacen pedidos al por mayor para tiendas o restaurantes? Falta confirmarlo.'];
