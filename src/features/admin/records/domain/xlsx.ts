// Excel (.xlsx) mínimo, sin librerías de hojas de cálculo: un .xlsx es un zip con unos pocos XML. Se usa para exportar
// (servidor), para la plantilla de importación y para leer lo que se importa (navegador). A diferencia del CSV, Excel
// lo abre siempre en columnas, con tildes y con los números como números, sin importar la configuración regional.

import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

export type XlsxCell = string | number | boolean | null | undefined;

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

// Caracteres que XML no admite (controles) fuera, y los especiales escapados.
const esc = (s: string) =>
  s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** 0 → A, 25 → Z, 26 → AA… */
export function columnName(i: number) {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

function columnIndex(ref: string) {
  const letters = /^[A-Z]+/.exec(ref)?.[0] ?? 'A';
  return [...letters].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
}

/** Nombre de hoja válido para Excel (máx. 31 caracteres, sin : \ / ? * [ ]). */
const sheetName = (s: string) => s.replace(/[:\\/?*[\]]/g, ' ').trim().slice(0, 31) || 'Hoja1';

/**
 * Libro con una hoja: la primera fila son los encabezados (en negrita, fija al hacer scroll y con filtros). Los
 * números van como números; lo demás, como texto.
 */
export function buildXlsx(sheet: string, headers: string[], rows: XlsxCell[][]): Uint8Array {
  const all = [headers, ...rows];
  // Ancho de cada columna según su contenido más largo (entre 8 y 60 caracteres).
  const widths = headers.map((_, c) =>
    Math.min(60, Math.max(8, ...all.slice(0, 500).map((r) => String(r[c] ?? '').length + 2))),
  );
  const cell = (v: XlsxCell, ref: string, header: boolean) => {
    if (v === null || v === undefined || v === '') return '';
    if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"><v>${v}</v></c>`;
    const text = typeof v === 'boolean' ? (v ? 'Sí' : 'No') : String(v);
    return `<c r="${ref}" t="inlineStr"${header ? ' s="1"' : ''}><is><t xml:space="preserve">${esc(text)}</t></is></c>`;
  };
  const sheetData = all
    .map((r, i) => `<row r="${i + 1}">${r.map((v, c) => cell(v, `${columnName(c)}${i + 1}`, i === 0)).join('')}</row>`)
    .join('');
  const last = `${columnName(Math.max(0, headers.length - 1))}${all.length}`;

  const files: Record<string, string> = {
    '[Content_Types].xml': `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    '_rels/.rels': `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `${XML}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${esc(sheetName(sheet))}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    'xl/styles.xml': `${XML}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    'xl/worksheets/sheet1.xml': `${XML}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths
      .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
      .join('')}</cols><sheetData>${sheetData}</sheetData>${headers.length ? `<autoFilter ref="A1:${last}"/>` : ''}</worksheet>`,
  };
  return zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])), { level: 6 });
}

/**
 * Primera hoja de un .xlsx como filas de texto (la primera fila, los encabezados). Necesita un DOMParser (navegador).
 * Las celdas vacías intermedias se respetan; los números salen como texto ("20000", "45678" si es una fecha de Excel).
 */
export function readXlsx(data: Uint8Array, parser: DOMParser): string[][] {
  const zip = unzipSync(data);
  const read = (path: string) => (zip[path] ? strFromU8(zip[path]) : '');
  const xml = (s: string) => parser.parseFromString(s, 'application/xml');

  // La primera hoja según el libro (no siempre se llama sheet1.xml).
  const wb = xml(read('xl/workbook.xml'));
  const firstId = wb.getElementsByTagName('sheet')[0]?.getAttribute('r:id');
  const rels = xml(read('xl/_rels/workbook.xml.rels'));
  const target = [...rels.getElementsByTagName('Relationship')].find((r) => r.getAttribute('Id') === firstId)?.getAttribute('Target');
  const sheetPath = target ? `xl/${target.replace(/^\/?xl\//, '')}` : 'xl/worksheets/sheet1.xml';
  if (!zip[sheetPath]) throw new Error('El archivo no tiene hojas.');

  const shared = [...xml(read('xl/sharedStrings.xml')).getElementsByTagName('si')].map((si) =>
    [...si.getElementsByTagName('t')].map((t) => t.textContent ?? '').join(''),
  );

  const rows: string[][] = [];
  for (const row of xml(read(sheetPath)).getElementsByTagName('row')) {
    const out: string[] = [];
    for (const c of row.getElementsByTagName('c')) {
      const i = columnIndex(c.getAttribute('r') ?? columnName(out.length));
      const type = c.getAttribute('t');
      const v = c.getElementsByTagName('v')[0]?.textContent ?? '';
      let text: string;
      if (type === 's') text = shared[Number(v)] ?? '';
      else if (type === 'inlineStr') text = [...c.getElementsByTagName('t')].map((t) => t.textContent ?? '').join('');
      else if (type === 'b') text = v === '1' ? 'Sí' : 'No';
      else text = v;
      while (out.length < i) out.push('');
      out[i] = text;
    }
    rows.push(out);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}
