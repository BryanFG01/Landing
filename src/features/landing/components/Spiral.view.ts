// Geometría de las espirales decorativas de fondo (Spiral.astro).
const SIZE = 400;
const CENTER = SIZE / 2;
const POINTS_PER_RING = 72;

// Décimas de unidad sin el cero inicial (0.4 → .4) para que el path pese menos en el HTML.
const num = (tenths: number) => String(tenths / 10).replace(/^(-?)0\./, '$1.');

// Anillos ligeramente irregulares, como surcos hechos a mano. Coordenadas relativas (`l`) calculadas sobre puntos
// ya redondeados, así el redondeo no se acumula y el anillo cierra donde empezó.
function ring(r: number, i: number) {
  let d = '';
  let px = 0;
  let py = 0;
  for (let p = 0; p < POINTS_PER_RING; p++) {
    const a = (p / POINTS_PER_RING) * Math.PI * 2;
    const wobble = 1 + Math.sin(a * 3 + i * 0.7) * 0.012 + Math.cos(a * 5 + i) * 0.008;
    const x = Math.round((CENTER + Math.cos(a) * r * wobble) * 10);
    const y = Math.round((CENTER + Math.sin(a) * r * wobble) * 10);
    d += p === 0 ? `M${num(x)} ${num(y)}` : `l${num(x - px)} ${num(y - py)}`;
    px = x;
    py = y;
  }
  return d + 'Z';
}

/** viewBox del SVG y un path por anillo, del más cercano al centro al más exterior. */
export function spiralView(rings: number) {
  const step = (CENTER - 8) / rings;
  return {
    viewBox: `0 0 ${SIZE} ${SIZE}`,
    paths: Array.from({ length: rings }, (_, i) => ring(step * (i + 1), i)),
  };
}
