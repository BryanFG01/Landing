// Operaciones inmutables sobre listas (filas de campos, columnas, filtros, elementos de un bloque).

/** Cambia de sitio dos elementos (sin salirse de los límites). */
export function swap<T>(list: T[], i: number, delta: number): T[] {
  const j = i + delta;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export const removeAt = <T>(list: T[], i: number) => list.filter((_, j) => j !== i);

export const replaceAt = <T>(list: T[], i: number, item: T) => list.map((x, j) => (j === i ? item : x));

export const patchAt = <T extends object>(list: T[], i: number, patch: Partial<T>) =>
  list.map((x, j) => (j === i ? { ...x, ...patch } : x));

/** { valor: 'Etiqueta' } → [{ value, label }] para un Select. */
export const optionsOf = <T extends string>(o: Record<T, string>) =>
  (Object.entries(o) as [T, string][]).map(([value, label]) => ({ value, label }));
