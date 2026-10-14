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
// ffmpeg -i public/video/finca-1.mp4 -frames:v 1 -vf "scale=in_color_matrix=bt709:in_range=tv:out_range=pc,format=rgb24" finca-1.png
import poster1 from '../assets/paseo/finca-1.webp';
import poster2 from '../assets/paseo/finca-2.webp';
import poster3 from '../assets/paseo/finca-3.webp';
import poster4 from '../assets/paseo/finca-4.webp';
import poster5 from '../assets/paseo/finca-5.webp';
import poster6 from '../assets/paseo/finca-6.webp';

export const photos = { amanecer, gallinas, nidos, recogida, pollos, seleccion, entrega };

// PENDIENTE: nombre provisional. Cambiándolo aquí cambia en toda la web (logo, títulos, SEO y JSON-LD).
export const marca = {
  nombre: 'Finca La Esperanza',
  lema: 'Huevos colorados y pollo de campo',
};

export const seo = {
  title: `${marca.nombre} · Huevos colorados de finca y pollo de campo`,
  description:
    'Huevos colorados recién recogidos y pollo de campo de buena calidad, directo de la finca. Haz tu pedido por WhatsApp y te lo llevamos.',
};

// Paseo por la finca (scroll world): un clip 16:9 sin audio por tramo, que avanza o retrocede con el scroll.
// Mientras el clip de un tramo no ha cargado se ve su primer fotograma (`poster`).
// Para que el scrub sea fluido, cada clip necesita keyframes muy seguidos. El color va marcado como BT.709 con curva
// sRGB: sin marcar, o con curva BT.709, el navegador pinta el vídeo más claro que el póster y el cambio se nota.
// ffmpeg -i clip.mp4 -an -vf "scale=1920:-2" -c:v libx264 -preset slow -crf 28 -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p -color_primaries bt709 -color_trc iec61966-2-1 -colorspace bt709 -color_range tv -movflags +faststart+write_colr public/video/finca-1.mp4
export type Parada = {
  id: string;
  lugar: string;
  /** Clip que va de esta parada a la siguiente. El de la última sigue hasta el final de la sección. */
  clip: string;
  /** Punto horizontal del vídeo (0 a 100) que queda a la vista en móvil, donde el 16:9 se recorta. */
  focus: number;
  /** Primer fotograma del clip, 16:9 como el vídeo. Se ve mientras el clip carga y encaja con él al aparecer. */
  poster: ImageMetadata;
  alt: string;
};

export const paseo: { paradas: Parada[] } = {
  paradas: [
    {
      id: 'inicio',
      lugar: 'La granja',
      clip: '/video/finca-1.mp4',
      focus: 50,
      poster: poster1,
      alt: 'Cajones de madera con huevos colorados sobre paja, frente al granero y los potreros de la finca',
    },
    {
      id: 'crianza',
      lugar: 'El nacimiento',
      clip: '/video/finca-2.mp4',
      focus: 55,
      poster: poster2,
      alt: 'Un pollito rompe la cáscara de un huevo colorado sobre la paja',
    },
    {
      id: 'precios',
      lugar: 'Los pollitos',
      clip: '/video/finca-3.mp4',
      focus: 65,
      poster: poster3,
      alt: 'Pollitos amarillos dentro de un comedero redondo de madera con grano',
    },
    {
      id: 'frescura',
      lugar: 'La crianza',
      clip: '/video/finca-4.mp4',
      focus: 25,
      poster: poster4,
      alt: 'Unas manos sostienen un pollito sobre un cajón de grano, con el granero y los potreros detrás',
    },
    {
      id: 'pollo',
      lugar: 'La recogida',
      clip: '/video/finca-5.mp4',
      focus: 45,
      poster: poster5,
      alt: 'Cajones con huevos colorados recién recogidos y gallinas caminando por el gallinero',
    },
    {
      id: 'como-pedir',
      lugar: 'Al aire libre',
      clip: '/video/finca-6.mp4',
      focus: 55,
      poster: poster6,
      alt: 'Un pollito entre gallinas coloradas que picotean grano sobre el pasto',
    },
  ],
};

// PENDIENTE: número de WhatsApp real, con indicativo de país y sin espacios ni signos (57 para Colombia).
const whatsapp = '570000000000';
const wa = (mensaje: string) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`;

export const links = {
  pedir: wa(`Hola, ${marca.nombre}. Quiero hacer un pedido de huevos y pollo de campo.`),
  semanal: wa(`Hola, ${marca.nombre}. Me interesa el pedido fijo cada semana.`),
  telefono: `tel:+${whatsapp}`,
  // PENDIENTE: Instagram real, o quitarlo del pie si no hay.
  instagram: 'https://www.instagram.com/',
};

// PENDIENTE: todos los datos de contacto son provisionales.
export const contacto = {
  ubicacion: '[Vereda y municipio]',
  zonaEntrega: '[Zona de entrega]',
  telefono: '+57 000 000 0000',
  instagram: '@[cuenta]',
  horario: '[Días y horas de atención]',
  entregas: '[Días de entrega]',
};

export const nav = [
  { label: 'La finca', href: '#crianza' },
  { label: 'Productos', href: '#productos' },
  { label: 'Combos', href: '#combos' },
  { label: 'Preguntas', href: '#preguntas' },
];

export type Producto = { nombre: string; detalle: string; precio: string };

// PENDIENTE: confirmar el catálogo, cómo se entrega cada producto y sus precios.
export const productos: Producto[] = [
  { nombre: 'Cubeta de huevos colorados', detalle: '30 huevos recogidos en la finca', precio: '$ —' },
  { nombre: 'Media cubeta', detalle: '15 huevos colorados', precio: '$ —' },
  { nombre: 'Pollo entero de campo', detalle: 'Limpio y listo para cocinar', precio: '$ —' },
  { nombre: 'Pollo despresado', detalle: 'Pechuga, perniles y alas, empacados por separado', precio: '$ —' },
];

// PENDIENTE: confirmar combos, qué incluyen y precios.
export const combos = [
  {
    nombre: 'Combo Casa',
    descripcion: '1 cubeta de huevos colorados y 1 pollo entero de campo.',
    precio: '$ —',
    nota: 'Para la semana de una familia pequeña',
  },
  {
    nombre: 'Combo Familia',
    descripcion: '2 cubetas de huevos colorados y 2 pollos de campo, enteros o despresados.',
    precio: '$ —',
    nota: 'Para familias grandes o para congelar',
    etiqueta: 'Recomendado',
  },
];

export const aLaMedida = {
  nombre: 'Pedido a la medida',
  descripcion: 'Dinos cuántos huevos y cuánto pollo necesitas y lo armamos para ti.',
  precio: 'Tú eliges',
};

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
    pregunta: '¿Cómo viene el pollo?',
    respuesta: 'Puedes pedirlo entero o despresado. Llega limpio, empacado y listo para cocinar o congelar.',
    pending: 'Confirmar presentación, peso aproximado y si llega fresco o congelado.',
  },
  {
    pregunta: '¿Cómo hago un pedido?',
    respuesta:
      'Escríbenos por WhatsApp con lo que necesitas. Te confirmamos el precio y el día de entrega por el mismo chat.',
  },
  {
    pregunta: '¿Hasta dónde hacen entregas?',
    respuesta: `Entregamos en ${contacto.zonaEntrega}. Si estás fuera de esa zona, escríbenos y miramos cómo hacértelo llegar.`,
    pending: 'Confirmar zona y días de entrega, y si el domicilio tiene costo.',
  },
  {
    pregunta: '¿Cómo puedo pagar?',
    respuesta: 'Puedes pagar en efectivo al recibir el pedido o por transferencia.',
    pending: 'Confirmar medios de pago.',
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
