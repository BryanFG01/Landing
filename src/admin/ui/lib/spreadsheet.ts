// Importar desde Excel (.xlsx) o CSV: leer el archivo, emparejar columnas con campos y armar las filas a enviar.
import type { FieldConfig } from '../../schema';
import { buildXlsx, readXlsx } from '../../xlsx';

/** Valor del selector de columna que significa "este campo no se importa". */
export const SKIP = '__skip__';

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Lector de CSV: detecta el separador (; , o tabulador), admite comillas y saltos de línea dentro de una celda y
 * quita el BOM que deja Excel.
 */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const nl = src.search(/\r?\n/);
  const firstLine = nl === -1 ? src : src.slice(0, nl);
  const sep = [';', ',', '\t'].reduce((best, s) => (firstLine.split(s).length > firstLine.split(best).length ? s : best));

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const endCell = () => {
    row.push(cell);
    cell = '';
  };
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell === '') quoted = true;
    else if (c === sep) endCell();
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      endCell();
      rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== '' || row.length) {
    endCell();
    rows.push(row);
  }
  // Sin filas vacías (Excel suele dejar una al final).
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** "Fecha de entrega" → "fecha_de_entrega", para emparejar encabezados con campos. */
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/(^_)|(_$)/g, '');

/** Filas de un .xlsx (primera hoja) o de un CSV. La primera fila son los encabezados. */
export async function readSpreadsheet(file: File): Promise<string[][]> {
  if (/\.xlsx$/i.test(file.name)) return readXlsx(new Uint8Array(await file.arrayBuffer()), new DOMParser());
  return parseCsv(await file.text());
}

/** Las fotos y archivos no se importan desde una hoja de cálculo. */
export const importableFields = (fields: FieldConfig[]) => fields.filter((f) => f.type !== 'image' && f.type !== 'file');

/** Emparejado automático: la columna cuyo encabezado coincide con la clave o la etiqueta del campo. */
export function autoMapping(headers: string[], fields: FieldConfig[]): Record<string, string> {
  const byName = new Map(headers.map((h, i) => [normalize(h), String(i)]));
  return Object.fromEntries(fields.map((f) => [f.key, byName.get(normalize(f.key)) ?? byName.get(normalize(f.label)) ?? SKIP]));
}

/** Opciones del selector de columna para cada campo. */
export const columnOptions = (headers: string[]) => [
  { value: SKIP, label: '— No importar —' },
  ...headers.map((h, i) => ({ value: String(i), label: h || `Columna ${i + 1}` })),
];

/** Filas a enviar a la API: { campo: texto de la celda }. */
export function rowsToPayload(rows: string[][], fields: FieldConfig[], mapping: Record<string, string>) {
  const mapped = fields.filter((f) => mapping[f.key] !== SKIP);
  return rows.map((r) => Object.fromEntries(mapped.map((f) => [f.key, r[Number(mapping[f.key])] ?? ''])));
}

export const missingRequired = (fields: FieldConfig[], mapping: Record<string, string>) =>
  fields.filter((f) => f.required && mapping[f.key] === SKIP);

/** Plantilla de importación: un Excel con solo los encabezados. */
export function templateBlob(sheetName: string, fields: FieldConfig[]) {
  const xlsx = buildXlsx(sheetName, fields.map((f) => f.label), []);
  return new Blob([xlsx as BlobPart], { type: XLSX_TYPE });
}
