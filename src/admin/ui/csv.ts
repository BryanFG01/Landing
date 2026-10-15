// Lector de CSV para importar: detecta el separador (; , o tabulador), admite comillas y saltos de línea dentro de
// una celda, y quita el BOM que deja Excel.

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const nl = src.search(/\r?\n/);
  const firstLine = nl === -1 ? src : src.slice(0, nl);
  const counts = [';', ',', '\t'].map((s) => [s, firstLine.split(s).length] as const);
  const sep = counts.sort((a, b) => b[1] - a[1])[0][0];

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell === '') quoted = true;
    else if (c === sep) {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  // Sin filas vacías (Excel suele dejar una al final).
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
