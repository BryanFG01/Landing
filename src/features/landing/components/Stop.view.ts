/** Dos cifras siempre (01, 02…): el contador de paradas no cambia de ancho al avanzar. */
const pad = (n: number) => String(n).padStart(2, '0');

/** Contador de la parada ("01 / 06"), con la posición empezando en 1. */
export function stopView(index: number, total: number) {
  return { position: pad(index + 1), count: pad(total) };
}
