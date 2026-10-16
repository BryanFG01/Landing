// Imágenes con URL fija en public/. Este archivo no importa nada de astro:assets porque también lo lee
// astro.config.mjs para añadir las imágenes al sitemap.
// Fotos y clips provisionales de stock (Pexels, licencia libre): ver media/finca/CREDITOS.md. Se cambian por los de
// la finca real.

export const ogImage = {
  src: '/og-image.jpg',
  title: 'Huevos colorados de finca y pollo de campo',
  alt: 'Canasta de mimbre con huevos colorados recién recogidos sobre un paño',
};

// Las mismas fotos de la finca en JPG con URL fija en public/photos: el sitemap de imágenes y el JSON-LD necesitan
// direcciones estables, no las que genera astro:assets en cada build.
export const fotosPublicas = [
  {
    src: '/photos/0-amanecer.jpg',
    lugar: 'El amanecer',
    alt: 'El sol sale entre las montañas sobre los potreros de la finca',
  },
  {
    src: '/photos/1-gallinas.jpg',
    lugar: 'Las gallinas',
    alt: 'Gallinas pintadas y coloradas picoteando en el pasto',
  },
  {
    src: '/photos/2-nidos.jpg',
    lugar: 'Los nidos',
    alt: 'Nido de viruta con huevos recién puestos',
  },
  {
    src: '/photos/3-recogida.jpg',
    lugar: 'La recogida',
    alt: 'Canasta de mimbre con huevos colorados sobre un paño',
  },
  {
    src: '/photos/4-pollos.jpg',
    lugar: 'El corral',
    alt: 'Gallinas posadas en una vara de madera en el corral',
  },
  {
    src: '/photos/5-seleccion.jpg',
    lugar: 'La selección',
    alt: 'Huevos colorados en su cubeta',
  },
  {
    src: '/photos/6-entrega.jpg',
    lugar: 'La entrega',
    alt: 'Canasta de huevos recogidos dentro del gallinero',
  },
];
