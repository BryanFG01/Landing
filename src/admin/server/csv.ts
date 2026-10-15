// Exportar (Excel .xlsx por defecto, o CSV) e importar. Al importar se aceptan los mismos valores legibles que se
// exportan (etiquetas de listas, Sí/No…) y las fechas que Excel guarda como número de serie.

import type { FieldConfig, Option, RecordRow } from '../schema';
import { buildXlsx } from '../xlsx';
import type { LoadedModule } from './modules';
import { relationOptions } from './sources';

const SEP = ';';

const cell = (v: string) => (/[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

const dateTime = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const labelOf = (options: Option[] | undefined, v: unknown) => options?.find((o) => o.value === String(v))?.label ?? String(v);

/** Valor legible de una celda: etiquetas de listas y relaciones, Sí/No, fechas en hora de Colombia. Números, como número. */
function exportValue(v: unknown, field: FieldConfig | undefined, options: Option[] | undefined): string | number {
  if (v === undefined || v === null || v === '') return '';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (typeof v === 'number') return field?.type === 'relation' ? labelOf(options, v) : v;
  if (Array.isArray(v)) return v.map((x) => labelOf(options, x)).join(' | ');
  if (typeof v === 'object') return 'name' in v ? String((v as { name: unknown }).name) : JSON.stringify(v);
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s) && !Number.isNaN(Date.parse(s))) return dateTime.format(new Date(s));
  if (field?.type === 'select' || field?.type === 'relation') return labelOf(options, s);
  return s;
}

/** Opciones de cada campo de lista o relación del módulo. */
export async function fieldOptions(mod: LoadedModule) {
  const out = new Map<string, Option[]>();
  for (const f of mod.fields) {
    if (f.type === 'relation') out.set(f.key, await relationOptions(f));
    else if (f.options) out.set(f.key, f.options);
  }
  return out;
}

/** Encabezados y celdas de la exportación (los mismos para Excel y CSV). */
async function exportTable(mod: LoadedModule, rows: RecordRow[]) {
  const options = await fieldOptions(mod);
  const cols: { key: string; label: string; field?: FieldConfig }[] = [
    ...(mod.source_type === 'records' ? [{ key: 'id', label: 'ID' }] : []),
    ...mod.fields.map((f) => ({ key: f.key, label: f.label, field: f })),
    ...(mod.source_type === 'records' ? [{ key: 'created_at', label: 'Creado' }] : []),
  ];
  if (mod.source_type === 'table' && mod.source_pk && !mod.fields.some((f) => f.key === mod.source_pk)) {
    cols.unshift({ key: mod.source_pk, label: mod.source_pk });
  }
  return {
    headers: cols.map((c) => c.label),
    cells: rows.map((row) => cols.map((c) => exportValue(row[c.key], c.field, options.get(c.key)))),
  };
}

/** Excel real: se abre en columnas con cualquier configuración regional. */
export async function toXlsx(mod: LoadedModule, rows: RecordRow[]) {
  const { headers, cells } = await exportTable(mod, rows);
  return buildXlsx(mod.name, headers, cells);
}

/** CSV con punto y coma y BOM (Excel en español). Los decimales, con coma. */
export async function toCsv(mod: LoadedModule, rows: RecordRow[]) {
  const { headers, cells } = await exportTable(mod, rows);
  const text = (v: string | number) => (typeof v === 'number' ? String(v).replace('.', ',') : v);
  const lines = [headers.map(cell).join(SEP), ...cells.map((r) => r.map((v) => cell(text(v))).join(SEP))];
  return `﻿${lines.join('\r\n')}\r\n`;
}

// ─── Importar ────────────────────────────────────────────────────────────────

/** "7.500", "7500,50", "$ 20.000" → número. */
export function parseNumber(s: string): number | null {
  let t = s.replace(/[$\s]/g, '');
  if (!t) return null;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) t = t.replace(/,/g, '');
  else t = t.replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();

const matchOption = (options: Option[] | undefined, s: string) =>
  options?.find((o) => o.value === s || norm(o.label) === norm(s) || norm(o.value) === norm(s))?.value;

/** Convierte el texto de una celda al valor que espera el campo. Devuelve undefined si no se puede. */
export function importValue(field: FieldConfig, raw: string, options: Option[] | undefined): unknown {
  const s = raw.trim();
  if (!s) return '';
  switch (field.type) {
    case 'number':
    case 'currency':
      return parseNumber(s) ?? s;
    case 'boolean':
      if (/^(s[ií]|true|verdadero|1|x|yes)$/i.test(s)) return true;
      if (/^(no|false|falso|0)$/i.test(s)) return false;
      return s;
    case 'date': {
      // Fecha escrita en Excel: llega como número de serie (días desde el 30/12/1899).
      if (/^\d{5}(\.\d+)?$/.test(s)) {
        return new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(s)) * 86_400_000).toISOString().slice(0, 10);
      }
      const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s);
      if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
      return s.slice(0, 10);
    }
    case 'select':
    case 'relation':
      return matchOption(options, s) ?? s;
    case 'multiselect':
      return s
        .split(/\s*[|,]\s*/)
        .filter(Boolean)
        .map((x) => matchOption(options, x) ?? x);
    case 'image':
    case 'file':
      return '';
    default:
      return s;
  }
}
